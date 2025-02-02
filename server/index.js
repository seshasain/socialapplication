import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import multer from 'multer';
import sharp from 'sharp';
import AWS from 'aws-sdk';
import { SocialMediaManager } from './services/socialMedia.js';
import path from 'path';
import { scheduleJob } from 'node-schedule';
import { createTwitterClient, postToTwitter } from './twitter.js';
import { createFacebookClient, postToFacebook } from './facebook.js';
import { schedulePost, cancelScheduledPost } from './schedular.js';
import { uploadToB2, deleteFromB2, saveFile, deleteFile } from '../src/utils/fileHandlers.js';
import axios from 'axios';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import mediaRoutes from './routes/media.js';
import integrationsRoutes from './routes/integrations.js';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import B2 from 'backblaze-b2';
import { ensureAuthorized } from './storage/b2.js';
import { SubscriptionStatus } from '@prisma/client';
import { Client } from '@notionhq/client';
import userRoutes from './routes/user.js';

dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});
const app = express();
const port = parseInt(process.env.PORT) || 5000;

// Define allowed origins globally
const allowedOrigins = [
  'http://localhost:5173',
  'https://crosspodium.web.app'
];

// Verify database connection
async function verifyDatabaseConnection() {
  const maxRetries = 5;
  const retryDelay = 5000; // 5 seconds
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log(`Attempting to connect to database (attempt ${retries + 1}/${maxRetries})...`);
      console.log(`Database URL: ${process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@')}`);
      
      await prisma.$connect();
      console.log('✅ Database connection successful');
      
      // Test query to verify full connectivity
      const testQuery = await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database query successful');
      
      return true;
    } catch (error) {
      retries++;
      console.error(`❌ Database connection attempt ${retries} failed:`, {
        error: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack
      });
      
      if (retries < maxRetries) {
        console.log(`Retrying in ${retryDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  console.error('❌ Failed to connect to database after maximum retries');
  process.exit(1); // Exit if we can't connect to the database
  return false;
}

// Call verifyDatabaseConnection before starting the server
app.use(async (req, res, next) => {
  if (!await verifyDatabaseConnection()) {
    return res.status(503).json({ error: 'Database connection failed' });
  }
  next();
});

// Middleware for CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Retry-Count'
    );
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use('/api/integrations', integrationsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/media', mediaRoutes);

// Enhanced health check endpoint
app.get('/', async (req, res) => {
  const dbConnected = await verifyDatabaseConnection();
  res.json({ 
    status: dbConnected ? 'ok' : 'database_error', 
    message: 'Server is running',
    port: port,
    env: process.env.NODE_ENV,
    database: dbConnected ? 'connected' : 'disconnected',
    databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@') // Hide password
  });
});

// Initialize services without blocking server start
(async () => {
  try {
    // Verify database connection first
    const dbConnected = await verifyDatabaseConnection();
    if (!dbConnected) {
      console.error('⚠️ Server started but database connection failed');
    }

    // Verify B2 credentials
    await verifyB2Credentials();
    console.log('✅ B2 credentials verified successfully');
  } catch (error) {
    console.error('⚠️ Service initialization error:', error);
  }
})();

// Error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Start server
let server;
const startServer = async (initialPort) => {
  let currentPort = initialPort;
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      server = app.listen(currentPort, () => {
        console.log(`Server is running on port ${currentPort}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
      });
      return true;
    } catch (error) {
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${currentPort} is in use, trying ${currentPort + 1}...`);
        currentPort++;
      } else {
        console.error('Failed to start server:', error);
        return false;
      }
    }
  }
  console.error(`Could not find an available port after ${maxAttempts} attempts`);
  return false;
};

// Start server
try {
  const success = await startServer(port);
  if (!success) {
    process.exit(1);
  }

  // Add graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(async () => {
      console.log('HTTP server closed');
      await prisma.$disconnect();
      process.exit(0);
    });
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}

// Configure multer for memory storage
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Invalid file type'));
//     }
//   }
// });
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
// const upload = multer({
//   storage: multer.diskStorage({
//     destination: function (req, file, cb) {
//       const uploadsDir = path.join(__dirname, '..', 'uploads');
//       if (!fs.existsSync(uploadsDir)) {
//         fs.mkdirSync(uploadsDir, { recursive: true });
//       }
//       cb(null, uploadsDir);
//     },
//     filename: function (req, file, cb) {
//       const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
//       cb(null, `${uniqueSuffix}-${file.originalname}`);
//     }
//   }),
//   limits: {
//     fileSize: 100 * 1024 * 1024 // 100MB
//   }
// });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Configure Twitter OAuth client
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY || '',
  appSecret: process.env.TWITTER_API_SECRET || '',
});

async function verifyB2Credentials() {
  try {
    await ensureAuthorized();
    console.log('✅ B2 credentials verified successfully');
  } catch (error) {
    console.error('❌ B2 credentials verification failed:', error);
    // Optionally exit the process if B2 is critical for your application
    // process.exit(1);
  }
}

// Call this when starting your server
await verifyB2Credentials();


// Store OAuth tokens temporarily (in production, use Redis or another session store)
const oauthTokens = new Map();

// Single CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = ['http://localhost:5173', 'https://crosspodium.web.app'];
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ error: 'Invalid token' });
    }

    try {
      // Verify user exists in database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });

      if (!user) {
        console.error('User not found for token:', decoded.id);
        return res.status(401).json({ error: 'User not found' });
      }

      req.user = decoded;
      next();
    } catch (error) {
      console.error('Database error in auth middleware:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}

// Twitter OAuth routes
app.get('/api/auth/twitter', authenticateToken, async (req, res) => {
  try {
    if (!req.user?.id) {
      throw new Error('User not authenticated');
    }

    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
    });

    const authLink = await client.generateAuthLink(
      `${process.env.APP_URL}/api/auth/twitter/callback`,
      { linkMode: 'authorize' }
    );

    // Store the OAuth token secret and user ID for later use
    oauthTokens.set(authLink.oauth_token, {
      oauth_token_secret: authLink.oauth_token_secret,
      userId: req.user.id
    });

    res.json({ authUrl: authLink.url });
  } catch (error) {
    console.error('Twitter auth error:', error);
    res.status(500).json({ error: 'Failed to initialize Twitter authentication' });
  }
});
// LinkedIn Routes
app.get('/api/auth/linkedin', authenticateToken, async (req, res) => {
  try {
    if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
      throw new Error('LinkedIn API credentials not configured');
    }

    const state = Math.random().toString(36).substring(7);
    const redirectUri = `${process.env.APP_URL}/api/auth/linkedin/callback`;
    const scope = ['r_liteprofile', 'w_member_social'];

    oauthTokens.set(state, {
      userId: req.user.id
    });

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${
      process.env.LINKEDIN_CLIENT_ID
    }&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope.join('%20')}`;

    res.json({ authUrl });
  } catch (error) {
    console.error('LinkedIn auth error:', error);
    res.status(500).json({ error: 'Failed to initialize LinkedIn authentication' });
  }
});

app.get('/api/auth/linkedin/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const storedData = oauthTokens.get(state);

    if (!storedData) {
      console.error('Invalid state parameter');
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?platform=linkedin&status=error`);
    }

    const { userId } = storedData;
    const redirectUri = `${process.env.APP_URL}/api/auth/linkedin/callback`;

    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      }),
    });

    const { access_token } = await tokenResponse.json();

    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    const profile = await profileResponse.json();

    // Find existing account
    const existingAccount = await prisma.socialAccount.findFirst({
      where: {
        userId,
        platform: 'linkedin'
      }
    });

    if (existingAccount) {
      await prisma.socialAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: access_token,
          username: `${profile.localizedFirstName} ${profile.localizedLastName}`,
          profileUrl: `https://linkedin.com/in/${profile.id}`
        }
      });
    } else {
      await prisma.socialAccount.create({
        data: {
          platform: 'linkedin',
          accessToken: access_token,
          username: `${profile.localizedFirstName} ${profile.localizedLastName}`,
          profileUrl: `https://linkedin.com/in/${profile.id}`,
          userId
        }
      });
    }

    oauthTokens.delete(state);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?platform=linkedin&status=connected`);
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?platform=linkedin&status=error`);
  }
});
// Twitter OAuth callback
app.get('/api/auth/twitter/callback', async (req, res) => {
  try {
    const { oauth_token, oauth_verifier } = req.query;
    
    if (!oauth_token || !oauth_verifier) {
      console.error('Missing OAuth tokens');
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?platform=twitter&status=error`);
    }

    // Get stored tokens
    const storedTokens = oauthTokens.get(oauth_token);
    if (!storedTokens) {
      console.error('No stored tokens found');
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?platform=twitter&status=error`);
    }

    const { oauth_token_secret, userId } = storedTokens;

    // Create client
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: oauth_token,
      accessSecret: oauth_token_secret
    });

    // Get access tokens
    const { accessToken, accessSecret, screenName, userId: twitterUserId } = 
      await client.login(oauth_verifier);

    // Find existing account
    const existingAccount = await prisma.socialAccount.findFirst({
      where: {
        userId,
        platform: 'twitter'
      }
    });

    if (existingAccount) {
      // Update existing account
      await prisma.socialAccount.update({
        where: { id: existingAccount.id },
        data: {
          username: screenName,
          profileUrl: `https://twitter.com/${screenName}`,
          accessToken,
          accessSecret,
          followerCount: 0
        }
      });
    } else {
      // Create new account
      await prisma.socialAccount.create({
        data: {
          userId,
          platform: 'twitter',
          username: screenName,
          profileUrl: `https://twitter.com/${screenName}`,
          accessToken,
          accessSecret,
          followerCount: 0
        }
      });
    }

    console.log('Twitter auth successful:', { screenName });
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?platform=twitter&status=connected`);
  } catch (error) {
    console.error('Twitter auth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?platform=twitter&status=error`);
  }
});

app.get('/api/auth/facebook/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const storedData = oauthTokens.get(state);

    if (!storedData) {
      throw new Error('Invalid state parameter');
    }

    const { userId } = storedData;
    const redirectUri = `${process.env.APP_URL}/api/auth/facebook/callback`;

    const tokenResponse = await fetch(
      `https://graph.facebook.com/v12.0/oauth/access_token?client_id=${
        process.env.FACEBOOK_APP_ID
      }&client_secret=${
        process.env.FACEBOOK_APP_SECRET
      }&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`
    );

    const { access_token } = await tokenResponse.json();

    const profileResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,name&access_token=${access_token}`
    );
    const profile = await profileResponse.json();

    // Find existing account
    const existingAccount = await prisma.socialAccount.findFirst({
      where: {
        userId,
        platform: 'facebook'
      }
    });

    if (existingAccount) {
      await prisma.socialAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: access_token,
          username: profile.name,
          profileUrl: `https://facebook.com/${profile.id}`
        }
      });
    } else {
      await prisma.socialAccount.create({
        data: {
          platform: 'facebook',
          accessToken: access_token,
          username: profile.name,
          profileUrl: `https://facebook.com/${profile.id}`,
          userId
        }
      });
    }

    oauthTokens.delete(state);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?platform=facebook&status=connected`);
  } catch (error) {
    console.error('Facebook callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?platform=facebook&status=error`);
  }
});

// Instagram Business API routes
app.get('/api/auth/instagram', async (req, res) => {
  try {
    const redirectUri = `${process.env.APP_URL}/api/auth/instagram/callback`;
    const scope = [
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_insights',
      'pages_show_list',
      'pages_read_engagement',
      'business_management'
    ];

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${
      process.env.FACEBOOK_APP_ID
    }&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope.join(',')}&response_type=code`;

    res.json({ authUrl });
  } catch (error) {
    console.error('Instagram auth error:', error);
    res.status(500).json({ error: 'Failed to initialize Instagram authentication' });
  }
});

app.get('/api/auth/instagram/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const redirectUri = `${process.env.APP_URL}/api/auth/instagram/callback`;

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${
        process.env.FACEBOOK_APP_ID
      }&client_secret=${
        process.env.FACEBOOK_APP_SECRET
      }&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`
    );

    const { access_token } = await tokenResponse.json();

    // Get Instagram Business Account ID
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${access_token}`
    );
    const accountsData = await accountsResponse.json();

    if (!accountsData.data || accountsData.data.length === 0) {
      throw new Error('No Facebook Pages found');
    }

    // Get Instagram Business Account connected to the Facebook Page
    const pageId = accountsData.data[0].id;
    const instagramResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${access_token}`
    );
    const instagramData = await instagramResponse.json();

    if (!instagramData.instagram_business_account) {
      throw new Error('No Instagram Business Account found');
    }

    const instagramAccountId = instagramData.instagram_business_account.id;

    // Get Instagram Business Account details
    const profileResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=username,profile_picture_url,followers_count&access_token=${access_token}`
    );
    const profile = await profileResponse.json();

    // Save account
    const socialAccount = await prisma.socialAccount.create({
      data: {
        platform: 'instagram',
        accessToken: access_token,
        username: profile.username,
        profileUrl: `https://instagram.com/${profile.username}`,
        userId: req.user.id,
        followerCount: profile.followers_count || 0,
        platformAccountId: instagramAccountId,
        platformPageId: pageId
      },
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?instagram=connected`);
  } catch (error) {
    console.error('Instagram callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?instagram=error`);
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching user data for ID:', req.user.id);
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        settings: true,
        subscription: {
          include: {
            plan: {
              include: {
                features: true,
                limits: true
              }
            }
          }
        },
        socialAccounts: true
      }
    });

    if (!user) {
      console.error('User not found:', req.user.id);
      return res.status(401).json({ error: 'Unauthorized - User not found' });
    }

    // Format user data
    const userData = {
      ...user,
      subscription: user.subscription ? {
        ...user.subscription,
        planId: user.subscription.plan.name.toLowerCase(),
        status: user.subscription.status,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
        features: user.subscription.plan.features,
        limits: user.subscription.plan.limits
      } : {
        planId: 'free',
        status: 'active'
      },
      password: undefined
    };

    res.json(userData);
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});
// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // First, find user with minimal data
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Then fetch full user data
    const fullUserData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        settings: true,
        subscription: {
          include: {
            plan: {
              include: {
                features: true,
                limits: true
              }
            }
          }
        },
        socialAccounts: true
      }
    });

    // Format user data
    const userData = {
      ...fullUserData,
      subscription: fullUserData.subscription ? {
        ...fullUserData.subscription,
        planId: fullUserData.subscription.plan.name.toLowerCase(),
        features: fullUserData.subscription.plan.features,
        limits: fullUserData.subscription.plan.limits
      } : null,
      password: undefined
    };

    res.json({ user: userData, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});




app.set('trust proxy', true); // Trust proxy headers in production
app.post('/api/auth/signup', async (req, res) => {
  try {
    console.log('Received signup request:', {
      email: req.body.email,
      name: req.body.name,
      redirectUrl: req.body.redirectUrl,
      hasCaptcha: !!req.body.captchaToken
    });

    // Verify reCAPTCHA token
    console.log('Verifying reCAPTCHA token...');
    if (process.env.NODE_ENV === 'production' && !req.body.captchaToken) {
      return res.status(400).json({ error: 'reCAPTCHA verification required' });
    }

    if (req.body.captchaToken) {
      const recaptchaResponse = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${req.body.captchaToken}`
      );

      if (!recaptchaResponse.data.success) {
        return res.status(400).json({ error: 'reCAPTCHA verification failed' });
      }
      console.log('reCAPTCHA verification successful');
    }

    // Check if user exists
    console.log('Checking if user exists...');
    const existingUser = await prisma.user.findUnique({
      where: { email: req.body.email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Create new user
    console.log('Creating new user...');
    const user = await prisma.user.create({
      data: {
        email: req.body.email,
        password: hashedPassword,
        name: req.body.name,
      },
    });
    console.log('User created successfully:', user.id);

    // Find trial plan
    console.log('Finding trial plan...');
    const trialPlan = await prisma.plan.findFirst({
      where: {
        name: 'trial',
        isDefault: true,
      },
    });

    if (!trialPlan) {
      console.error('Trial plan not found');
      return res.status(500).json({ error: 'Trial plan not found' });
    }

    // Calculate trial end date (14 days from now)
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    // Create subscription with trial plan
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: 'trial',
        status: SubscriptionStatus.TRIAL,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        trialStart: new Date(),
        trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    // Create default user settings
    await prisma.userSettings.create({
      data: {
        userId: user.id,
        emailNotifications: true,
        pushNotifications: false,
        smsNotifications: false,
        language: 'en',
        theme: 'light',
        autoSchedule: false,
        defaultVisibility: 'public',
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data and token
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription: {
          planId: subscription.planId,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          trialStart: subscription.trialStart,
          trialEnd: subscription.trialEnd
        },
      },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Settings endpoints
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: req.user.id }
    });

    if (!settings) {
      // Create default settings if they don't exist
      const defaultSettings = await prisma.userSettings.create({
        data: {
          userId: req.user.id
        }
      });
      return res.json(defaultSettings);
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/settings', authenticateToken, async (req, res) => {
  try {
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.user.id },
      update: req.body,
      create: {
        userId: req.user.id,
        ...req.body
      }
    });

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Profile update endpoint
app.patch('/api/auth/update', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: req.body,
      include: {
        settings: true
      }
    });

    // Remove sensitive data
    const { password, ...userData } = user;
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Analytics endpoints
app.get('/api/analytics/overview', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '7d', platform = 'all', performance = 'overall' } = req.query;
    const userId = req.user.id;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default: // 7d
        startDate.setDate(startDate.getDate() - 7);
    }

    // Fetch posts with their platforms and analytics
    const posts = await prisma.post.findMany({
      where: {
        userId,
        platforms: {
          some: platform !== 'all' ? { platform } : {}
        },
        scheduledDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        platforms: {
          include: {
            analytics: true
          }
        },
        mediaFiles: true
      },
      orderBy: {
        scheduledDate: 'desc'
      }
    });

    // Fetch analytics data
    const analytics = await prisma.analytics.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        },
        ...(platform !== 'all' ? { platform } : {})
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Process posts data
    const processedPosts = posts.map(post => {
      // Calculate total engagement metrics across all platforms
      const metrics = post.platforms.reduce((acc, platform) => {
        const platformAnalytics = platform.analytics[0] || { 
          reach: 0, 
          impressions: 0, 
          engagement: 0,
          likes: 0,
          comments: 0,
          shares: 0
        };
        
        return {
          reach: acc.reach + platformAnalytics.reach,
          impressions: acc.impressions + platformAnalytics.impressions,
          engagement: acc.engagement + platformAnalytics.engagement,
          likes: acc.likes + platformAnalytics.likes,
          comments: acc.comments + platformAnalytics.comments,
          shares: acc.shares + platformAnalytics.shares
        };
      }, { 
        reach: 0, 
        impressions: 0, 
        engagement: 0,
        likes: 0,
        comments: 0,
        shares: 0
      });

      return {
        id: post.id,
        caption: post.caption,
        platforms: post.platforms.map(p => ({
          platform: p.platform,
          status: p.status,
          publishedAt: p.publishedAt
        })),
        mediaFiles: post.mediaFiles.map(file => ({
          url: file.url,
          type: file.type
        })),
        createdAt: post.createdAt.toISOString(),
        ...metrics
      };
    });

    // Calculate totals
    const totals = analytics.reduce((acc, curr) => ({
      reach: acc.reach + curr.reach,
      impressions: acc.impressions + curr.impressions,
      engagement: acc.engagement + curr.engagement,
      shares: acc.shares + curr.shares
    }), { reach: 0, impressions: 0, engagement: 0, shares: 0 });

    // Filter posts based on performance if needed
    let filteredPosts = processedPosts;
    if (performance === 'top') {
      filteredPosts = processedPosts
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 5);
    } else if (performance === 'trending') {
      filteredPosts = processedPosts
        .sort((a, b) => b.reach - a.reach)
        .slice(0, 5);
    }

    res.json({
      timeRange,
      analytics,
      posts: filteredPosts,
      totals
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});


app.get('/api/overview/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get posts with proper relations
    const [scheduledCount, publishedCount, socialAccounts] = await Promise.all([
      // Count scheduled platforms
      prisma.postPlatform.count({
        where: {
          post: {
            userId
          },
          status: 'scheduled'
        }
      }),
      // Count published platforms
      prisma.postPlatform.count({
        where: {
          post: {
            userId
          },
          status: 'published'
        }
      }),
      // Get social accounts
      prisma.socialAccount.findMany({
        where: { userId },
        select: {
          followerCount: true
        }
      })
    ]);

    const totalPosts = publishedCount + scheduledCount;
    const totalFollowers = socialAccounts.reduce((acc, account) => acc + (account.followerCount || 0), 0);

    // Get analytics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const analytics = await prisma.analytics.findMany({
      where: {
        userId,
        date: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        engagement: true,
        impressions: true
      }
    });

    const avgEngagementRate = analytics.length > 0
      ? (analytics.reduce((acc, curr) => acc + (curr.engagement / Math.max(curr.impressions, 1)), 0) / analytics.length) * 100
      : 0;

    res.json({
      totalPosts,
      engagementRate: avgEngagementRate,
      totalFollowers,
      scheduledPosts: scheduledCount
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch overview stats' });
  }
});

// app.get('/api/analytics/overview', authenticateToken, async (req, res) => {
//   try {
//     console.log("test");
//     const { timeRange = '7d' } = req.query;
//     const userId = req.user.id;

//     // Calculate date range
//     const endDate = new Date();
//     const startDate = new Date();

//     switch (timeRange) {
//       case '30d':
//         startDate.setDate(startDate.getDate() - 30);
//         break;
//       case '90d':
//         startDate.setDate(startDate.getDate() - 90);
//         break;
//       default: // 7d
//         startDate.setDate(startDate.getDate() - 7);
//     }

//     // Get analytics through post platforms
//     const postPlatforms = await prisma.postPlatform.findMany({
//       where: {
//         post: {
//           userId
//         }
//       },
//       include: {
//         analytics: {
//           where: {
//             date: {
//               gte: startDate,
//               lte: endDate
//             }
//           }
//         }
//       }
//     });

//     // Transform the data to match the expected format
//     const analytics = postPlatforms.flatMap(platform =>
//       platform.analytics.map(analytic => ({
//         date: analytic.date,
//         platform: platform.platform,
//         reach: analytic.reach,
//         impressions: analytic.impressions,
//         engagement: analytic.engagement,
//         shares: analytic.shares
//       }))
//     );

//     // Calculate totals
//     const totals = analytics.reduce((acc, curr) => ({
//       reach: acc.reach + curr.reach,
//       impressions: acc.impressions + curr.impressions,
//       engagement: acc.engagement + curr.engagement,
//       shares: acc.shares + curr.shares
//     }), { reach: 0, impressions: 0, engagement: 0, shares: 0 });

//     res.json({
//       timeRange,
//       analytics,
//       totals
//     });
//     console.log("test",timeRange, analytics, totals);
//   } catch (error) {
//     console.error('Analytics error:', error);
//     res.status(500).json({ error: 'Failed to fetch analytics' });
//   }
// });

app.get('/api/posts/scheduled', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const posts = await prisma.post.findMany({
      where: {
        userId,
        platforms: {
          some: {
            status: 'scheduled'
          }
        },
        scheduledDate: {
          gte: new Date()
        }
      },
      include: {
        mediaFiles: true,
        platforms: true
      },
      orderBy: {
        scheduledDate: 'asc'
      }
    });

    res.json(posts);
  } catch (error) {
    console.error('Scheduled posts error:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled posts' });
  }
});

app.get('/api/social-accounts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const accounts = await prisma.socialAccount.findMany({
      where: { userId }
    });

    res.json(accounts);
  } catch (error) {
    console.error('Social accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch social accounts' });
  }
});




app.post('/api/social-accounts/connect', authenticateToken, async (req, res) => {
  try {
    const { platform } = req.body;
    const userId = req.user.id;

    // Check if account already exists
    const existingAccount = await prisma.socialAccount.findFirst({
      where: {
        userId,
        platform: platform.toLowerCase()
      }
    });

    if (existingAccount) {
      return res.status(400).json({ error: 'Account already connected' });
    }

    // Mock data for demo purposes
    const account = await prisma.socialAccount.create({
      data: {
        platform: platform.toLowerCase(),
        accessToken: 'mock-token',
        accessSecret: 'mock-refresh',
        followerCount: Math.floor(Math.random() * 50000) + 1000,
        userId,
        username: `demo_${platform.toLowerCase()}`,
        profileUrl: `https://${platform.toLowerCase()}.com/demo`
      }
    });

    res.json(account);
  } catch (error) {
    console.error('Error connecting social account:', error);
    res.status(500).json({ error: 'Failed to connect social account' });
  }
});


// Helper function for immediate publishing
async function handleImmediatePublishing(post, user, caption, hashtags) {
  for (const platformData of post.platforms) {
    const socialAccount = user.socialAccounts.find(
      account => account.platform.toLowerCase() === platformData.platform.toLowerCase()
    );

    if (!socialAccount) {
      await prisma.postPlatform.update({
        where: { id: platformData.id },
        data: {
          status: 'failed',
          error: `No connected ${platformData.platform} account found`
        }
      });
      continue;
    }

    try {
      switch (platformData.platform.toLowerCase()) {
        case 'twitter':
          const client = createTwitterClient(
            socialAccount.accessToken,
            socialAccount.accessSecret
          );
          const result = await postToTwitter(client, {
            caption: `${caption} ${hashtags}`.trim(),
            mediaFiles: post.mediaFiles
          });

          await prisma.postPlatform.update({
            where: { id: platformData.id },
            data: {
              status: 'published',
              publishedAt: new Date(),
              externalId: result.id
            }
          });
          break;

        default:
          await prisma.postPlatform.update({
            where: { id: platformData.id },
            data: {
              status: 'pending',
              error: 'Platform publishing not implemented'
            }
          });
      }
    } catch (error) {
      await prisma.postPlatform.update({
        where: { id: platformData.id },
        data: {
          status: 'failed',
          error: error.message
        }
      });
    }
  }

  // Update main post status based on platform results
  await updatePostStatus(post.id);
}

// Helper function to update the post status
async function updatePostStatus(postId) {
  const updatedPlatforms = await prisma.postPlatform.findMany({
    where: { postId }
  });

  const allPublished = updatedPlatforms.every(p => p.status === 'published');
  const allFailed = updatedPlatforms.every(p => p.status === 'failed');

  await prisma.post.update({
    where: { id: postId },
    data: {
      status: allPublished ? 'published' : allFailed ? 'failed' : 'partial',
      error: allFailed ? 'Failed to publish to all platforms' : null
    }
  });
}


app.post('/api/auth/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Billing information endpoint
app.get('/api/billing', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.subscription === 'free') {
      return res.status(404).json({ error: 'No billing information available for free plan' });
    }

    // In a real application, you would fetch this from your payment provider
    const billingInfo = {
      plan: user.subscription,
      status: 'active',
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount: user.subscription === 'standard' ? 29.99 : 79.99,
      cardLast4: '4242',
      cardBrand: 'Visa'
    };

    res.json(billingInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Team management routes
app.get('/api/team', authenticateToken, async (req, res) => {
  try {
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        userId: req.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // If no team members found, return empty array instead of error
    if (!teamMembers || teamMembers.length === 0) {
      return res.json([]);
    }

    res.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

app.post('/api/team', authenticateToken, async (req, res) => {
  try {
    const { name, email, role } = req.body;

    const existingMember = await prisma.teamMember.findUnique({
      where: { email }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'Team member already exists' });
    }

    const teamMember = await prisma.teamMember.create({
      data: {
        userId: req.user.id,
        name,
        email,
        role,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      }
    });

    res.status(201).json(teamMember);
  } catch (error) {
    console.error('Error creating team member:', error);
    res.status(500).json({ error: 'Failed to create team member' });
  }
});

app.patch('/api/team/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!teamMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const updatedMember = await prisma.teamMember.update({
      where: { id },
      data: { role }
    });

    res.json(updatedMember);
  } catch (error) {
    console.error('Error updating team member:', error);
    res.status(500).json({ error: 'Failed to update team member' });
  }
});

app.delete('/api/team/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!teamMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    await prisma.teamMember.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({ error: 'Failed to delete team member' });
  }
});

// Store scheduled jobs in memory
const scheduledJobs = new Map();

app.get('/api/posts/history', authenticateToken, async (req, res) => {
  try {
    const { filter = 'all', sortBy = 'date', order = 'desc' } = req.query;

    // Build where clause based on filter
    const whereClause = {
      userId: req.user.id
    };

    // Build order by clause
    const orderByClause = {};
    if (sortBy === 'date') {
      orderByClause.scheduledDate = order;
    } else if (sortBy === 'engagement') {
      orderByClause.engagementRate = order;
    }

    // Query posts with platforms included
    const posts = await prisma.post.findMany({
      where: whereClause,
      orderBy: orderByClause,
      include: {
        mediaFiles: true,
        platforms: {
          select: {
            id: true,
            platform: true,
            status: true,
            publishedAt: true,
            error: true
          }
        }
      }
    });

    // Filter posts based on platform statuses
    let filteredPosts = posts;
    if (filter !== 'all') {
      filteredPosts = posts.filter(post => {
        switch (filter) {
          case 'published':
            return post.platforms.every(p => p.status === 'published');
          case 'scheduled':
            return post.platforms.every(p => p.status === 'scheduled');
          case 'failed':
            return post.platforms.some(p => p.status === 'failed');
          default:
            return true;
        }
      });
    }

    res.json(filteredPosts);
  } catch (error) {
    console.error('Error fetching post history:', error);
    res.status(500).json({ error: 'Failed to fetch post history' });
  }
});



// Delete media endpoint
app.delete('/api/media/:id', authenticateToken, async (req, res) => {
  try {
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id: req.params.id }
    });

    if (!mediaFile) {
      return res.status(404).json({ error: 'Media file not found' });
    }

    if (mediaFile.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this file' });
    }

    // Delete from S3
    await deleteFromB2(mediaFile.s3Key);

    // Delete from database
    await prisma.mediaFile.delete({
      where: { id: req.params.id }
    });

    res.status(200).json({ message: 'Media file deleted successfully' });
  } catch (error) {
    console.error('Media deletion error:', error);
    res.status(500).json({ error: 'Failed to delete media file' });
  }
});
app.post('/api/posts', authenticateToken, async (req, res) => {
  try {
    // Validate request body exists
    if (!req.body) {
      return res.status(400).json({ error: 'Missing request body' });
    }

    const {
      caption,
      scheduledDate,
      platforms,
      hashtags,
      visibility,
      mediaFiles,
      platformSpecificData,
      threadContent,
      publishNow,
    } = req.body;
    const settings = platforms[0]?.settings; 
    console.log("settings", settings);
    
    // Validate required fields
    if (
      !caption ||
      !platforms ||
      !Array.isArray(platforms) ||
      platforms.length === 0
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        userId: req.user.id,
        caption,
        scheduledDate: new Date(scheduledDate),
        hashtags: hashtags || '',
        visibility,
        mediaFiles: mediaFiles?.length
          ? {
              connect: mediaFiles.map((id) => ({ id })),
            }
          : undefined,
        platforms: {
          create: platforms.map((platform) => ({
            platform: platform.platform,
            status: publishNow ? 'publishing' : 'scheduled',
            settings: platform.settings || {},
          })),
        },
      },
      include: {
        mediaFiles: true,
        platforms: true,
      },
    });

    // Handle immediate publishing
    if (publishNow) {
      for (const platform of platforms) {
        try {
          const socialAccount = await prisma.socialAccount.findFirst({
            where: {
              userId: req.user.id,
              platform: platform.platform,
            },
          });

          if (!socialAccount) {
            throw new Error(`No connected ${platform.platform} account found`);
          }

          let client;
          let result;

          switch (platform.platform.toLowerCase()) {
            case 'twitter':
              client = await createTwitterClient(
                socialAccount.accessToken,
                socialAccount.accessSecret
              );
              result = await postToTwitter(req.user.id, client, {
                caption: caption + (hashtags ? ' ' + hashtags : ''),
                threadContent,
                settings,
                mediaFiles: post.mediaFiles,
              });
              break;

            case 'facebook':
              client = createFacebookClient(socialAccount.accessToken);
              result = await postToFacebook(client, {
                caption: caption + (hashtags ? ' ' + hashtags : ''),
                mediaFiles: post.mediaFiles,
              });
              break;

            case 'instagram':
              client = createInstagramClient(socialAccount.accessToken);
              result = await postToInstagram(client, {
                caption: caption + (hashtags ? ' ' + hashtags : ''),
                mediaFiles: post.mediaFiles,
              });
              break;

            case 'linkedin':
              client = createLinkedInClient(socialAccount.accessToken);
              result = await postToLinkedIn(client, {
                caption: caption + (hashtags ? ' ' + hashtags : ''),
                mediaFiles: post.mediaFiles,
              });
              break;

            default:
              throw new Error(`Unsupported platform: ${platform.platform}`);
          }

          // Update platform status
          await prisma.postPlatform.update({
            where: {
              id: post.platforms.find((p) => p.platform === platform.platform)
                ?.id,
            },
            data: {
              status: 'published',
              publishedAt: new Date(),
              externalId: result.id || result.postId,
            },
          });
        } catch (error) {
          console.error(`Failed to publish to ${platform.platform}:`, error);

          // Update platform status with error
          await prisma.postPlatform.update({
            where: {
              id: post.platforms.find((p) => p.platform === platform.platform)
                ?.id,
            },
            data: {
              status: 'failed',
              error: error.message,
            },
          });
        }
      }

      // Fetch updated post
      const updatedPost = await prisma.post.findUnique({
        where: { id: post.id },
        include: {
          mediaFiles: true,
          platforms: true,
        },
      });

      return res.json(updatedPost);
    }

    // Schedule post for later
    await schedulePost(post);

    res.json(post);
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Media upload endpoint
app.post('/api/media/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Upload to B2 and get URL
    const fileUrl = await uploadToB2(req.file.buffer, req.file.mimetype, req.file.originalname);

    // Save file metadata to database
    const mediaFile = await prisma.mediaFile.create({
      data: {
        userId: req.user.id,
        url: fileUrl,
        type: req.file.mimetype,
        filename: req.file.originalname,
        size: req.file.size,
        s3Key: `uploads/${req.file.originalname}`
      }
    });

    res.json(mediaFile);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});



// Delete media endpoint
app.delete('/api/media/:id', authenticateToken, async (req, res) => {
  try {
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id: req.params.id }
    });

    if (!mediaFile) {
      return res.status(404).json({ error: 'Media file not found' });
    }

    if (mediaFile.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this file' });
    }

    // Delete from S3
    await deleteFromB2(mediaFile.s3Key);

    // Delete from database
    await prisma.mediaFile.delete({
      where: { id: req.params.id }
    });

    res.status(200).json({ message: 'Media file deleted successfully' });
  } catch (error) {
    console.error('Media deletion error:', error);
    res.status(500).json({ error: 'Failed to delete media file' });
  }
});



// Update the PUT endpoint for updating posts
app.put('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      caption,
      scheduledDate,
      platforms,
      hashtags,
      visibility,
      threadContent,
      settings,
      mediaFiles
    } = req.body;

    // Verify post ownership
    const existingPost = await prisma.post.findFirst({
      where: {
        id,
        userId: req.user.id,
        status: 'scheduled'
      }
    });
    await prisma.socialAccount.delete({
      where: { id }
    });

    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found or cannot be updated' });
    }

    // Cancel existing scheduled job
    await cancelScheduledPost(id);

    // Parse platforms and media files
    const selectedPlatforms = Array.isArray(platforms) ? platforms : JSON.parse(platforms);
    const mediaFileIds = mediaFiles ? JSON.parse(mediaFiles) : [];

    // Update the post
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        caption,
        scheduledDate: new Date(scheduledDate),
        hashtags,
        visibility,
        mediaFiles: {
          set: [], // Clear existing connections
          connect: mediaFileIds.map(fileId => ({ id: fileId }))
        },
        platforms: selectedPlatforms // Store selected platforms
      },
      include: {
        mediaFiles: true
      }
    });

    // Schedule the updated post
    await schedulePost(updatedPost);

    res.json(updatedPost);
  } catch (error) {
    console.error('Post update error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});


app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        settings: true,
        subscription: {
          include: {
            plan: true,
            paymentMethod: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive information
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, timezone, bio } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name,
        email,
        timezone,
        bio
      },
      include: {
        settings: true,
        subscription: {
          include: {
            plan: true,
            paymentMethod: true
          }
        }
      }
    });

    // Remove sensitive information
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

app.put('/api/user/settings', authenticateToken, async (req, res) => {
  try {
    const {
      emailNotifications,
      pushNotifications,
      smsNotifications,
      language,
      theme,
      autoSchedule,
      defaultVisibility
    } = req.body;

    const updatedSettings = await prisma.userSettings.upsert({
      where: { userId: req.user.id },
      update: {
        emailNotifications,
        pushNotifications,
        smsNotifications,
        language,
        theme,
        autoSchedule,
        defaultVisibility
      },
      create: {
        userId: req.user.id,
        emailNotifications,
        pushNotifications,
        smsNotifications,
        language,
        theme,
        autoSchedule,
        defaultVisibility
      }
    });

    res.json(updatedSettings);
  } catch (error) {
    console.error('Update user settings error:', error);
    res.status(500).json({ error: 'Failed to update user settings' });
  }
});

// Password update route
app.post('/api/auth/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});
// Update the retry post endpoint
app.post('/retry/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        mediaFiles: true,
        platforms: {
          include: {
            analytics: true
          }
        },
        user: {
          include: {
            socialAccounts: true
          }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const failedPlatforms = post.platforms.filter(p => p.status === 'failed');

    for (const platform of failedPlatforms) {
      try {
        await prisma.analytics.deleteMany({
          where: {
            postPlatformId: platform.id
          }
        });

        const socialAccount = post.user.socialAccounts.find(
          account => account.platform.toLowerCase() === platform.platform.toLowerCase()
        );

        if (!socialAccount) {
          await prisma.postPlatform.update({
            where: { id: platform.id },
            data: {
              status: 'failed',
              error: `No connected ${platform.platform} account found`
            }
          });
          continue;
        }

        const client = await SocialMediaManager.initializeClient(platform.platform, {
          accessToken: socialAccount.accessToken,
          accessSecret: socialAccount.accessSecret,
          username: socialAccount.username
        });

        const result = await SocialMediaManager.publishContent(
          platform.platform,
          client,
          {
            caption: `${post.caption} ${post.hashtags}`.trim(),
            mediaFiles: post.mediaFiles
          }
        );

        await prisma.postPlatform.update({
          where: { id: platform.id },
          data: {
            status: 'published',
            publishedAt: new Date(),
            externalId: result.id,
            error: null
          }
        });

        await prisma.analytics.create({
          data: {
            userId: post.userId,
            postPlatformId: platform.id,
            platform: platform.platform.toLowerCase(),
            date: new Date(),
            reach: 0,
            impressions: 0,
            engagement: 0,
            clicks: 0,
            shares: 0,
            saves: 0,
            likes: 0,
            comments: 0
          }
        });
      } catch (error) {
        await prisma.postPlatform.update({
          where: { id: platform.id },
          data: {
            status: 'failed',
            error: error.message
          }
        });
      }
    }

    const updatedPlatforms = await prisma.postPlatform.findMany({
      where: { postId: post.id }
    });

    const allFailed = updatedPlatforms.every(p => p.status === 'failed');

    await prisma.post.update({
      where: { id: post.id },
      data: {
        error: allFailed ? 'Failed to publish to all platforms' : null
      }
    });

    const updatedPost = await prisma.post.findUnique({
      where: { id },
      include: {
        mediaFiles: true,
        platforms: {
          include: {
            analytics: true
          }
        }
      }
    });

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error('Post retry error:', error);
    res.status(500).json({ error: 'Failed to retry post' });
  }
});


// Add user profile routes
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        settings: true,
        subscription: {
          include: {
            plan: {
              include: {
                features: true,
                limits: true
              }
            },
            paymentMethod: true,
            usageRecords: {
              orderBy: {
                recordedAt: 'desc'
              },
              take: 1
            }
          }
        },
        socialAccounts: {
          select: {
            id: true,
            platform: true,
            username: true,
            profileUrl: true,
            followerCount: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive information
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, timezone, bio } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: {
            id: req.user.id
          }
        }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name,
        email,
        timezone,
        bio,
        updatedAt: new Date()
      },
      include: {
        settings: true,
        subscription: {
          include: {
            plan: {
              include: {
                features: true,
                limits: true
              }
            },
            paymentMethod: true
          }
        },
        socialAccounts: {
          select: {
            id: true,
            platform: true,
            username: true,
            profileUrl: true,
            followerCount: true
          }
        }
      }
    });

    // Remove sensitive information
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Delete associated analytics first
    await prisma.analytics.deleteMany({
      where: { postId: id }
    });

    // Delete post platforms
    await prisma.postPlatform.deleteMany({
      where: { postId: id }
    });

    // Delete the post
    await prisma.post.delete({
      where: { id }
    });

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Post deletion error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});







app.get('/api/user/usage', authenticateToken, async (req, res) => {
  try {
    // Get user's subscription and plan limits
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        subscription: {
          include: {
            plan: {
              include: {
                limits: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.subscription?.plan) {
      return res.status(400).json({ error: 'User does not have an active subscription' });
    }

    // Get plan limits
    const planLimits = user.subscription.plan.limits.reduce((acc, limit) => {
      acc[limit.name] = limit.value;
      return acc;
    }, {});

    // Count scheduled posts using proper schema relations
    const scheduledPosts = await prisma.postPlatform.count({
      where: {
        post: {
          userId: req.user.id
        },
        status: 'scheduled'
      }
    });

    // Count published posts
    const publishedPosts = await prisma.postPlatform.count({
      where: {
        post: {
          userId: req.user.id
        },
        status: 'published'
      }
    });

    const totalPosts = scheduledPosts + publishedPosts;

    // Calculate days left in subscription
    let daysLeft = 30; // default to 30 days
    if (user.subscription.currentPeriodEnd) {
      const endDate = new Date(user.subscription.currentPeriodEnd);
      const now = new Date();
      daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    // For trial users, use trial duration from plan limits
    const daysLimit = user.subscription.status === SubscriptionStatus.TRIAL ? 14 : 30;

    res.json({
      postsUsed: totalPosts || 0,
      postsLimit: planLimits.monthlyPosts || 10,
      daysLeft: daysLeft || 0,
      daysLimit: daysLimit || 30,
    });
  } catch (error) {
    console.error('Usage stats error:', error);
    res.status(500).json({ error: 'Failed to fetch usage stats' });
  }
});

app.post('/ticket', authenticateToken, async (req, res) => {
  try {
    const { subject, message } = req.body;
    const userId = req.user.id;

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject,
        message,
        status: 'open',
        priority: 'medium',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Support ticket creation error:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

// Get user's support tickets
app.get('/tickets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const tickets = await prisma.supportTicket.findMany({
      where: {
        userId,
      },
      include: {
        responses: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(tickets);
  } catch (error) {
    console.error('Support tickets fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

// Add response to a ticket
app.post('/ticket/:id/response', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    // Verify ticket belongs to user
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const response = await prisma.response.create({
      data: {
        supportTicketId: id,
        message,
        isStaff: false,
      },
    });

    res.status(201).json(response);
  } catch (error) {
    console.error('Support ticket response error:', error);
    res.status(500).json({ error: 'Failed to add response' });
  }
});

// Get user's feedback history
app.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const feedbackHistory = await prisma.feedback.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(feedbackHistory);
  } catch (error) {
    console.error('Feedback history fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback history' });
  }
});
app.post('/feedback', authenticateToken, async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const userId = req.user.id;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const feedbackEntry = await prisma.feedback.create({
      data: {
        userId,
        rating,
        feedback,
        status: 'new',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(feedbackEntry);
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

app.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const feedbackHistory = await prisma.feedback.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(feedbackHistory);
  } catch (error) {
    console.error('Feedback history fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback history' });
  }
});


// Add static file serving
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Media routes
const b2 = new B2({
  applicationKeyId: process.env.VITE_B2_APPLICATION_KEY_ID,
  applicationKey: process.env.VITE_B2_APPLICATION_KEY
});


app.post('/api/media/presigned-url', authenticateToken, async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    await ensureAuthorized();

    // Get upload URL and auth token
    const { uploadUrl, authorizationToken } = await b2.getUploadUrl({
      bucketId: process.env.VITE_B2_BUCKET_ID
    });

    // Generate unique file key
    const fileId = uuidv4();
    const key = `uploads/${fileId}-${filename}`;
    res.json({
      uploadUrl,
      authorizationToken,
      fileId,
      key
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

app.post('/api/media/register', authenticateToken, async (req, res) => {
  try {
    const { filename, type, size, b2Key } = req.body;
    const userId = req.user.id;

    if (!filename || !type || !size || !b2Key) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Construct the public URL
    const url = `${process.env.VITE_B2_PUBLIC_URL}/file/${process.env.VITE_B2_BUCKET_NAME}/${b2Key}`;

    const mediaFile = await prisma.mediaFile.create({
      data: {
        userId,
        url,
        type,
        filename,
        size,
        s3Key: b2Key, // Using s3Key field for B2 key for now
      },
    });

    res.json(mediaFile);
  } catch (error) {
    console.error('File registration error:', error);
    res.status(500).json({ error: 'Failed to register file' });
  }
});

app.delete('/api/media/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const mediaFile = await prisma.mediaFile.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!mediaFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    await ensureAuthorized();

    // List file versions to get fileId
    const response = await b2.listFileNames({
      bucketId: process.env.VITE_B2_BUCKET_ID,
      startFileName: mediaFile.s3Key,
      maxFileCount: 1
    });

    if (response.data.files.length > 0) {
      const file = response.data.files[0];
      await b2.deleteFileVersion({
        fileId: file.fileId,
        fileName: file.fileName
      });
    }

    // Delete from database
    await prisma.mediaFile.delete({
      where: { id },
    });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});
// Delete single file
app.delete('/api/media/delete/:id', authenticateToken, async (req, res) => {
  try {
    // First find the file to ensure it exists and belongs to the user
    const mediaFile = await prisma.mediaFile.findFirst({
      where: {
        id: id,
        userId: userId
      },
      include: {
        posts: true // Include posts to check references
      }
    });

    if (!mediaFile) {
      return res.status(404).json({
        success: false,
        message: 'File not found or you do not have permission to delete it'
      });
    }

    // Check if file is being used in any posts
    if (mediaFile.posts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete file as it is being used in one or more posts'
      });
    }

    // Delete from B2 storage
    await deleteFromB2(mediaFile.s3Key);

    // Delete from database
    await prisma.mediaFile.delete({
      where: {
        id: mediaFile.id
      }
    });

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete file' });
  }
});

// Bulk delete files
app.post('/api/media/batch-delete', authenticateToken, async (req, res) => {
  try {
    const { fileIds } = req.body;
    if (!Array.isArray(fileIds)) {
      return res.status(400).json({ error: 'fileIds must be an array' });
    }
    // Get files from database
    const files = await prisma.mediaFile.findMany({
      where: {
        id: { in: fileIds },
        userId: req.user.id // Ensure user owns the files
      }
    });
    // Delete files from B2 and database
    await Promise.all(files.map(async (file) => {
      try {
        // Delete from B2
        if (file.s3Key) {
          await deleteFromB2(file.s3Key);
        }

        // Delete from database
        await prisma.mediaFile.delete({
          where: { id: file.id }
        });
      } catch (error) {
        console.error(`Failed to delete file ${file.id}:`, error);
      }
    }));
    res.json({ success: true, message: 'Files deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete files' });
  }
});
// Media verification endpoint
app.post('/api/media/verify', authenticateToken, async (req, res) => {
  try {
    const { mediaIds } = req.body;
    
    if (!mediaIds || !Array.isArray(mediaIds)) {
      return res.status(400).json({ error: 'Invalid media IDs provided' });
    }

    // Verify each media file exists in database
    const mediaFiles = await prisma.mediaFile.findMany({
      where: {
        AND: [
          { id: { in: mediaIds } },
          { userId: req.user.id } // Ensure files belong to user
        ]
      }
    });

    // Check if all media files were found
    if (mediaFiles.length !== mediaIds.length) {
      const foundIds = mediaFiles.map(file => file.id);
      const missingIds = mediaIds.filter(id => !foundIds.includes(id));
      console.log('Missing media files:', missingIds);
      return res.status(404).json({ 
        error: 'One or more media files not found',
        missingIds 
      });
    }

    // All files verified successfully
    res.json({ success: true, files: mediaFiles });

  } catch (error) {
    console.error('Media verification error:', error);
    res.status(500).json({ error: 'Failed to verify media files' });
  }
});



app.post('/api/media/cleanup', async (req, res) => {
  try {
    // Get all PostPlatform entries that are either published or failed
    const postPlatforms = await prisma.postPlatform.findMany({
      where: {
        OR: [
          { status: 'published' },
          { status: 'failed' }
        ]
      },
      include: {
        post: {
          include: {
            mediaFiles: {
              where: {
                url: {
                  not: ''
                }
              }
            }
          }
        }
      }
    });
    console.log(postPlatforms);

    // Track processed media files to avoid duplicate deletions
    const processedMediaIds = new Set();

    for (const platform of postPlatforms) {
      const mediaFiles = platform.post.mediaFiles; 
      console.log(mediaFiles);
      for (const mediaFile of mediaFiles) {
        if (processedMediaIds.has(mediaFile.id)) {
          continue;
        }

        try {
          console.log("deleting file,", mediaFile.id);
          // Delete from B2
          await deleteFromB2(mediaFile.id);


          // Update MediaFile record
          await prisma.mediaFile.update({
            where: {
              id: mediaFile.id
            },
            data: {
              url: ''
            }
          });

          processedMediaIds.add(mediaFile.id);
          console.log(`Successfully cleaned up media file: ${mediaFile.id}`);
        } catch (error) {
          console.error(`Failed to cleanup media file ${mediaFile.id}:`, error);
        }
      }

      // Update post to remove references to deleted media files
      await prisma.post.update({
        where: {
          id: platform.post.id
        },
        data: {
          mediaFiles: {
            disconnect: mediaFiles.map(file => ({ id: file.id }))
          }
        }
      });
    }

    res.json({
      success: true,
      message: `Media cleanup completed. Processed ${processedMediaIds.size} files`
    });
  } catch (error) {
    console.error('Media cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup media files',
      error: error.message
    });
  }
});





// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Account deactivation endpoint
app.post('/api/auth/deactivate', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.user.id;

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'deactivated',
        deactivatedAt: new Date(),
        deactivationReason: reason || null
      }
    });

    // Schedule account deletion after 30 days
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);
    
    // Store the scheduled deletion date
    await prisma.user.update({
      where: { id: userId },
      data: {
        scheduledDeletionDate: deletionDate
      }
    });

    // Clear auth token
    res.clearCookie('token');
    
    res.json({ 
      message: 'Account deactivated successfully. You have 30 days to reactivate your account before permanent deletion.',
      deletionDate
    });
  } catch (error) {
    console.error('Account deactivation error:', error);
    res.status(500).json({ error: 'Failed to deactivate account' });
  }
});

// Account reactivation endpoint
app.post('/api/auth/reactivate', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || user.status !== 'deactivated') {
      return res.status(400).json({ error: 'Account not found or not deactivated' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reactivate account
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'active',
        deactivatedAt: null,
        deactivationReason: null,
        scheduledDeletionDate: null
      }
    });

    // Generate new token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

    res.json({ 
      message: 'Account reactivated successfully',
      token
    });
  } catch (error) {
    console.error('Account reactivation error:', error);
    res.status(500).json({ error: 'Failed to reactivate account' });
  }
});

// Permanent account deletion endpoint
app.post('/api/auth/delete', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Get user's media files
    const mediaFiles = await prisma.mediaFile.findMany({
      where: { userId }
    });

    // Delete all user-related data
    await Promise.all([
      // Delete all user data
      prisma.socialAccount.deleteMany({ where: { userId } }),
      prisma.userSettings.deleteMany({ where: { userId } }),
      prisma.teamMember.deleteMany({ where: { userId } }),
      prisma.analytics.deleteMany({ where: { userId } }),
      prisma.mediaFile.deleteMany({ where: { userId } }),
      prisma.post.deleteMany({ where: { userId } }),
      prisma.feedback.deleteMany({ where: { userId } }),
      prisma.supportTicket.deleteMany({ where: { userId } }),
      prisma.subscription.deleteMany({ where: { userId } }),
      
      // Delete media files from storage
      ...mediaFiles.map(file => deleteFromB2(file.s3Key))
    ]);

    // Finally, delete the user
    await prisma.user.delete({
      where: { id: userId }
    });

    // Clear auth token
    res.clearCookie('token');
    
    res.json({ message: 'Account and all associated data permanently deleted' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Add new endpoint to handle trial to paid transition
app.post('/api/subscription/convert-trial', authenticateToken, async (req, res) => {
  try {
    const { planId } = req.body;
    
    // Get user's current subscription
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        subscription: true
      }
    });

    if (!user || !user.subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Verify user is in trial
    if (user.subscription.status !== SubscriptionStatus.TRIAL) {
      return res.status(400).json({ error: 'User is not in trial period' });
    }

    // Get the selected plan
    const plan = plans[planId];
    if (!plan) {
      return res.status(404).json({ error: 'Selected plan not found' });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Update subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id: user.subscription.id },
      data: {
        planId: planId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        // Clear trial data
        trialStart: null,
        trialEnd: null,
        // Ensure cancellation flags are cleared
        cancelAtPeriodEnd: false
      }
    });

    // Create a usage record to track the conversion
    await prisma.usageRecord.create({
      data: {
        subscriptionId: updatedSubscription.id,
        feature: 'subscription_conversion',
        quantity: 1,
        metadata: {
          fromPlan: 'trial',
          toPlan: planId,
          conversionDate: now.toISOString()
        }
      }
    });

    res.json({
      message: 'Successfully converted trial to paid subscription',
      subscription: updatedSubscription
    });
  } catch (error) {
    console.error('Error converting trial:', error);
    res.status(500).json({ error: 'Failed to convert trial subscription' });
  }
});

// Add endpoint to check trial eligibility
app.get('/api/subscription/trial-eligibility', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        subscription: {
          select: {
            status: true,
            trialStart: true,
            trialEnd: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // User is eligible if:
    // 1. They never had a subscription
    // 2. They never had a trial before (check trialStart)
    // 3. Their current subscription is not in trial status
    const isEligible = !user.subscription || 
      (!user.subscription.trialStart && user.subscription.status !== SubscriptionStatus.TRIAL);

    res.json({ 
      isEligible,
      currentStatus: user.subscription?.status || null,
      message: isEligible ? 
        'You are eligible for a free trial!' : 
        'You have already used your trial period.'
    });
  } catch (error) {
    console.error('Error checking trial eligibility:', error);
    res.status(500).json({ error: 'Failed to check trial eligibility' });
  }
});

// Trial Stats Endpoint
app.get('/api/trial/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's subscription and plan limits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: {
          include: {
            plan: {
              include: {
                limits: true
              }
            }
          }
        }
      }
    });

    if (!user?.subscription?.plan) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Get plan limits
    const planLimits = user.subscription.plan.limits.reduce((acc, limit) => {
      acc[limit.name] = limit.value;
      return acc;
    }, {});

    // Get today's posts count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const postsToday = await prisma.post.count({
      where: {
        userId,
        createdAt: {
          gte: today
        }
      }
    });

    // Get scheduled posts count
    const scheduledPosts = await prisma.post.count({
      where: {
        userId,
        scheduledDate: {
          gt: new Date()
        }
      }
    });

    // Get platform usage
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const posts = await prisma.post.findMany({
      where: {
        userId,
        createdAt: {
          gte: monthStart
        }
      },
      include: {
        platforms: true
      }
    });

    const platformUsage = posts.reduce((acc, post) => {
      post.platforms.forEach(platform => {
        if (platform.status === 'published') {
          acc[platform.platform] = (acc[platform.platform] || 0) + 1;
        }
      });
      return acc;
    }, {});

    // Get team members limit from plan
    const teamMembers = planLimits.teamMembers || 1;

    res.json({
      postsToday,
      scheduledPosts,
      teamMembers,
      platformUsage,
      limits: planLimits
    });
  } catch (error) {
    console.error('Error fetching trial stats:', error);
    res.status(500).json({ error: 'Failed to fetch trial stats' });
  }
});

app.get('/api/posts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const posts = await prisma.post.findMany({
      where: { userId },
      include: {
        mediaFiles: true,
        platforms: {
          include: {
            analytics: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(posts);
  } catch (error) {
    console.error('Posts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Social account disconnect endpoint
app.delete('/api/social-accounts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log('Disconnect request:', { id, userId });

    // First find the account to verify ownership
    const account = await prisma.socialAccount.findFirst({
      where: {
        id,
        userId
      }
    });

    console.log('Found account:', account);

    if (!account) {
      console.log('Account not found or unauthorized');
      return res.status(404).json({ error: 'Social account not found or you do not have permission to disconnect it' });
    }

    // If account exists and belongs to user, delete it
    const deletedAccount = await prisma.socialAccount.delete({
      where: { id }
    });

    console.log('Successfully deleted account:', deletedAccount);

    res.json({ 
      success: true,
      message: 'Account successfully disconnected',
      platform: account.platform
    });
  } catch (error) {
    console.error('Account disconnection error:', error);
    if (error.message.includes('Social account not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to disconnect account' });
    }
  }
});

// OAuth initialization endpoints
app.get('/api/social-accounts/connect', authenticateToken, async (req, res) => {
  try {
    const { platform } = req.query;
    
    if (!platform) {
      return res.status(400).json({ error: 'Platform parameter is required' });
    }
    
    const userId = req.user.id;

    switch (platform.toLowerCase()) {
      case 'twitter': {
        const client = new TwitterApi({
          appKey: process.env.TWITTER_API_KEY,
          appSecret: process.env.TWITTER_API_SECRET
        });

        const authLink = await client.generateAuthLink(
          `${process.env.APP_URL}/api/auth/twitter/callback`
        );

        // Store OAuth tokens
        oauthTokens.set(authLink.oauth_token, {
          oauth_token_secret: authLink.oauth_token_secret,
          userId
        });

        res.json({ authUrl: authLink.url });
        break;
      }

      case 'facebook': {
        const state = Math.random().toString(36).substring(7);
        const redirectUri = `${process.env.APP_URL}/api/auth/facebook/callback`;
        
        // Store state for validation
        oauthTokens.set(state, { userId });

        const authUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${
          process.env.FACEBOOK_APP_ID
        }&redirect_uri=${
          encodeURIComponent(redirectUri)
        }&state=${state}&scope=pages_show_list,pages_read_engagement,pages_manage_posts`;

        res.json({ authUrl });
        break;
      }

      case 'linkedin': {
        const state = Math.random().toString(36).substring(7);
        const redirectUri = `${process.env.APP_URL}/api/auth/linkedin/callback`;
        
        // Store state for validation
        oauthTokens.set(state, { userId });

        const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${
          process.env.LINKEDIN_CLIENT_ID
        }&redirect_uri=${
          encodeURIComponent(redirectUri)
        }&state=${state}&scope=r_liteprofile%20w_member_social`;

        res.json({ authUrl });
        break;
      }

      default:
        return res.status(400).json({ error: `Unsupported platform: ${platform}` });
    }
  } catch (error) {
    console.error('OAuth initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize OAuth flow' });
  }
});

// Disconnect endpoint
app.delete('/api/social-accounts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const account = await prisma.socialAccount.findFirst({
      where: { id, userId }
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await prisma.socialAccount.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Account disconnection error:', error);
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
});

// Define subscription status enum
// const SubscriptionStatus = {
//   TRIAL: 'TRIAL',
//   ACTIVE: 'ACTIVE',
//   PAST_DUE: 'PAST_DUE',
//   CANCELING: 'CANCELING',
//   CANCELLED: 'CANCELLED'
// };

// Update subscription status checks
app.get('/api/subscription/status', authenticateToken, async (req, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.user.id, status: SubscriptionStatus.ACTIVE }
    });
    // ... rest of the code ...
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

app.get('/api/subscription/trial', authenticateToken, async (req, res) => {
  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.user.id, status: SubscriptionStatus.TRIAL }
  });
  // ... existing code ...
});

app.post('/api/subscription/cancel', authenticateToken, async (req, res) => {
  await prisma.subscription.update({
    where: { userId: req.user.id },
    data: {
      status: SubscriptionStatus.CANCELING,
      cancelAtPeriodEnd: true
    }
  });
  // ... existing code ...
});

app.post('/api/subscription/reactivate', authenticateToken, async (req, res) => {
  await prisma.subscription.update({
    where: { userId: req.user.id },
    data: {
      status: SubscriptionStatus.ACTIVE,
      cancelAtPeriodEnd: false
    }
  });
  // ... existing code ...
});

// ... existing code ...

// Update subscription status checks
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.user.id, status: SubscriptionStatus.ACTIVE }
  });
  // ... existing code ...
});

app.post('/api/subscription/upgrade', authenticateToken, async (req, res) => {
  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.user.id, status: SubscriptionStatus.ACTIVE }
  });
  // ... existing code ...
});

app.get('/api/subscription/trial/status', authenticateToken, async (req, res) => {
  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.user.id, status: SubscriptionStatus.TRIAL }
  });
  // ... existing code ...
});

app.post('/api/subscription/upgrade/preview', authenticateToken, async (req, res) => {
  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.user.id, status: SubscriptionStatus.ACTIVE }
  });
  // ... existing code ...
});

app.get('/api/subscription/usage', authenticateToken, async (req, res) => {
  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.user.id, status: SubscriptionStatus.ACTIVE }
  });
  // ... existing code ...
});

// ... existing code ...

// Notion OAuth routes
app.get('/api/auth/notion', authenticateToken, async (req, res) => {
  try {
    if (!process.env.NOTION_CLIENT_ID) {
      throw new Error('Notion client ID not configured');
    }

    const state = Math.random().toString(36).substring(7);
    const redirectUri = `${process.env.APP_URL}/api/auth/notion/callback`;
    
    // Store state and user ID for validation
    oauthTokens.set(state, {
      userId: req.user.id,
      timestamp: Date.now()
    });

    const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${
      process.env.NOTION_CLIENT_ID
    }&redirect_uri=${
      encodeURIComponent(redirectUri)
    }&response_type=code&state=${state}&owner=user`;

    res.json({ authUrl });
  } catch (error) {
    console.error('Notion auth error:', error);
    res.status(500).json({ error: 'Failed to initialize Notion authentication' });
  }
});

app.get('/api/auth/notion/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const storedData = oauthTokens.get(state);

    if (!storedData) {
      throw new Error('Invalid state parameter');
    }

    const { userId } = storedData;
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
        ).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.APP_URL}/api/auth/notion/callback`
      })
    });

    const { 
      access_token,
      workspace_id,
      workspace_name,
      workspace_icon,
      bot_id 
    } = await tokenResponse.json();

    // Save or update Notion integration in database
    await prisma.notionIntegration.upsert({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: workspace_id
        }
      },
      update: {
        accessToken: access_token,
        workspaceName: workspace_name,
        workspaceIcon: workspace_icon,
        botId: bot_id,
        lastUpdated: new Date()
      },
      create: {
        userId,
        workspaceId: workspace_id,
        workspaceName: workspace_name,
        workspaceIcon: workspace_icon,
        accessToken: access_token,
        botId: bot_id
      }
    });

    // Clean up
    oauthTokens.delete(state);

    // Redirect back to app
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?platform=notion&status=connected`);
  } catch (error) {
    console.error('Notion callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?platform=notion&status=error`);
  }
});

// Notion database endpoints
app.get('/api/notion/databases', authenticateToken, async (req, res) => {
  try {
    const integration = await prisma.notionIntegration.findFirst({
      where: { userId: req.user.id },
      orderBy: { lastUpdated: 'desc' }
    });

    if (!integration) {
      return res.status(404).json({ error: 'Notion integration not found' });
    }

    const notion = new Client({ auth: integration.accessToken });
    
    const response = await notion.search({
      filter: { property: 'object', value: 'database' }
    });

    const databases = response.results.map(db => ({
      id: db.id,
      title: db.title[0]?.plain_text || 'Untitled',
      description: db.description?.[0]?.plain_text || null,
      lastEdited: db.last_edited_time
    }));

    res.json({ databases });
  } catch (error) {
    console.error('Failed to fetch Notion databases:', error);
    res.status(500).json({ error: 'Failed to fetch databases' });
  }
});

app.post('/api/notion/select-database', authenticateToken, async (req, res) => {
  try {
    const { databaseId } = req.body;
    
    if (!databaseId) {
      return res.status(400).json({ error: 'Database ID is required' });
    }

    const integration = await prisma.notionIntegration.findFirst({
      where: { userId: req.user.id },
      orderBy: { lastUpdated: 'desc' }
    });

    if (!integration) {
      return res.status(404).json({ error: 'Notion integration not found' });
    }

    const notion = new Client({ auth: integration.accessToken });
    
    // Verify database access
    const database = await notion.databases.retrieve({
      database_id: databaseId
    });

    // Update user's selected database
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        settings: {
          update: {
            notionDatabaseId: databaseId
          }
        }
      }
    });

    res.json({
      success: true,
      database: {
        id: database.id,
        title: database.title[0]?.plain_text || 'Untitled',
        description: database.description?.[0]?.plain_text || null
      }
    });
  } catch (error) {
    console.error('Failed to select Notion database:', error);
    res.status(500).json({ error: 'Failed to select database' });
  }
});