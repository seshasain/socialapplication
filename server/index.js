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
import { schedulePost, cancelScheduledPost } from './schedular.js';
import { uploadToB2, deleteFromB2, saveFile, deleteFile, UPLOAD_DIR } from '../src/utils/fileHandlers.js';
import axios from 'axios';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
const prisma = new PrismaClient();
const app = express();


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Store OAuth tokens temporarily (in production, use Redis or another session store)
const oauthTokens = new Map();

app.use(cors());
app.use(express.json());

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Twitter OAuth routes
app.get('/api/auth/twitter', authenticateToken, async (req, res) => {
  try {
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
      throw new Error('Twitter API credentials not configured');
    }

    const { url, oauth_token, oauth_token_secret } = await twitterClient.generateAuthLink(
      'http://localhost:5000/api/auth/twitter/callback',
      { linkMode: 'authorize' }
    );

    // Store the OAuth token secret for this session
    oauthTokens.set(oauth_token, {
      oauth_token_secret,
      userId: req.user.id
    });

    res.json({ authUrl: url });
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
      throw new Error('Invalid state parameter');
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

    await prisma.socialAccount.create({
      data: {
        platform: 'linkedin',
        accessToken: access_token,
        username: `${profile.localizedFirstName} ${profile.localizedLastName}`,
        profileUrl: `https://linkedin.com/in/${profile.id}`,
        userId
      },
    });

    oauthTokens.delete(state);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?linkedin=connected`);
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?linkedin=error`);
  }
});
app.get('/api/auth/twitter/callback', async (req, res) => {
  try {
    const { oauth_token, oauth_verifier } = req.query;
    const storedData = oauthTokens.get(oauth_token);

    if (!storedData) {
      throw new Error('Invalid OAuth token');
    }

    const { oauth_token_secret, userId } = storedData;

    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: oauth_token,
      accessSecret: oauth_token_secret,
    });

    const { client: loggedClient, accessToken, accessSecret } = await client.login(oauth_verifier);
    const twitterUser = await loggedClient.v2.me();

    // Save the Twitter account to the database
    const socialAccount = await prisma.socialAccount.create({
      data: {
        platform: 'twitter',
        accessToken,
        refreshToken: accessSecret,
        username: twitterUser.data.username,
        profileUrl: `https://twitter.com/${twitterUser.data.username}`,
        userId
      }
    });

    // Clean up stored OAuth token
    oauthTokens.delete(oauth_token);

    // Redirect back to the frontend
    res.redirect(`http://localhost:5173/dashboard?twitter=connected`);
  } catch (error) {
    console.error('Twitter callback error:', error);
    res.redirect(`http://localhost:5173/dashboard?twitter=error`);
  }
})
// Facebook Routes
app.get('/api/auth/facebook', authenticateToken, async (req, res) => {
  try {
    if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
      throw new Error('Facebook API credentials not configured');
    }

    const state = Math.random().toString(36).substring(7);
    const redirectUri = `${process.env.APP_URL}/api/auth/facebook/callback`;
    const scope = [
      'pages_manage_posts',
      'pages_read_engagement',
      'instagram_basic',
      'instagram_content_publish',
    ];

    oauthTokens.set(state, {
      userId: req.user.id
    });

    const authUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${
      process.env.FACEBOOK_APP_ID
    }&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope.join(',')}`;

    res.json({ authUrl });
  } catch (error) {
    console.error('Facebook auth error:', error);
    res.status(500).json({ error: 'Failed to initialize Facebook authentication' });
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

    await prisma.socialAccount.create({
      data: {
        platform: 'facebook',
        accessToken: access_token,
        username: profile.name,
        profileUrl: `https://facebook.com/${profile.id}`,
        userId
      },
    });

    oauthTokens.delete(state);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?facebook=connected`);
  } catch (error) {
    console.error('Facebook callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?facebook=error`);
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
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        settings: true,
        subscription: {
          include: {
            plan: true,
          },
        },
        socialAccounts: {
          select: {
            id: true,
            platform: true,
            username: true,
            profileUrl: true,
            followerCount: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Format user data
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscription: user.subscription ? {
        planId: user.subscription.plan.name.toLowerCase(),
        status: user.subscription.status,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
      } : {
        planId: 'free',
        status: 'active',
      },
      settings: user.settings || {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        language: 'en',
        theme: 'light',
        autoSchedule: true,
        defaultVisibility: 'public',
      },
      timezone: user.timezone || 'UTC',
      bio: user.bio || '',
      avatar: user.avatar,
      socialAccounts: user.socialAccounts,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
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

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        settings: true,
        subscription: {
          include: {
            plan: true,
          },
        },
        socialAccounts: {
          select: {
            id: true,
            platform: true,
            username: true,
            profileUrl: true,
            followerCount: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

    // Format user data
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscription: user.subscription ? {
        planId: user.subscription.plan.name.toLowerCase(),
        status: user.subscription.status,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
      } : {
        planId: 'free',
        status: 'active',
      },
      settings: user.settings || {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        language: 'en',
        theme: 'light',
        autoSchedule: true,
        defaultVisibility: 'public',
      },
      timezone: user.timezone || 'UTC',
      bio: user.bio || '',
      avatar: user.avatar,
      socialAccounts: user.socialAccounts,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json({ token, user: userData });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});




app.set('trust proxy', true); // Trust proxy headers in production
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, redirectUrl, captchaToken } = req.body;

    // Verify reCAPTCHA
    if (!captchaToken) {
      return res.status(400).json({ error: 'reCAPTCHA verification required' });
    }

    // Verify the captcha token with Google
    try {
      const recaptchaResponse = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: process.env.RECAPTCHA_SECRET_KEY,
            response: captchaToken,
          },
        }
      );

      if (!recaptchaResponse.data.success) {
        return res.status(400).json({ error: 'reCAPTCHA verification failed' });
      }
    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      return res.status(400).json({ error: 'reCAPTCHA verification failed' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get the user's IP address from the request (using a proxy or middleware)
    const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Fetch location (country code) from IP
    let countryCode = 'US'; // Default to 'US' if geolocation fails
    try {
      const geoResponse = await axios.get(`http://api.ipstack.com/${userIp}?access_key=${process.env.IPSTACK_API_KEY}`);
      countryCode = geoResponse.data.country_code || 'US';  // Use the country code from API or default to 'US'
    } catch (error) {
      console.error('Geolocation fetch error:', error);
    }

    // Create user with default settings and the detected country
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'USER',
        settings: {
          create: {
            emailNotifications: true,
            pushNotifications: true,
            smsNotifications: false,
            language: 'en',
            theme: 'light',
            autoSchedule: true,
            defaultVisibility: 'public',
          },
        },
        timezone: 'UTC',
        country: countryCode,
      },
      include: {
        settings: true,
        subscription: true,
        socialAccounts: true,
      },
    });

    // Check if 'free' plan exists
    const freePlan = await prisma.plan.findUnique({
      where: { name: 'free' },
    });

    if (!freePlan) {
      return res.status(400).json({ error: 'Free plan not found' });
    }

    // Create subscription with the free plan
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: freePlan.id,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(new Date().setDate(new Date().getDate() + 7)),
      },
    });

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

    // Format user data
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscription: {
        planId: 'free',
        status: 'active',
      },
      settings: user.settings,
      timezone: 'UTC',
      country: user.country,
      bio: '',
      avatar: null,
      socialAccounts: [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Respond with the token and user data, including redirect URL
    res.status(201).json({
      token,
      user: userData,
      redirectUrl: redirectUrl || '/pricing',
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
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
        refreshToken: 'mock-refresh',
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
            socialAccount.refreshToken
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
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
    const {
      caption,
      scheduledDate,
      platforms,
      hashtags,
      visibility,
      mediaFiles,
      publishNow
    } = req.body;

    // Validate required fields
    if (!caption) {
      return res.status(400).json({ error: 'Caption is required' });
    }

    if (!platforms || !Array.isArray(JSON.parse(platforms)) || JSON.parse(platforms).length === 0) {
      return res.status(400).json({ error: 'At least one platform must be selected' });
    }

    const post = await prisma.post.create({
      data: {
        userId: req.user.id,
        caption,
        scheduledDate: publishNow ? new Date() : new Date(scheduledDate),
        hashtags: hashtags || '',
        visibility: visibility || 'public',
        mediaFiles: mediaFiles ? {
          connect: JSON.parse(mediaFiles).map(id => ({ id }))
        } : undefined,
        platforms: {
          create: JSON.parse(platforms).map(platform => ({
            platform,
            status: publishNow ? 'publishing' : 'scheduled',
            settings: {}
          }))
        }
      },
      include: {
        mediaFiles: true,
        platforms: true
      }
    });

    // If publishing now, trigger the publishing process and create analytics
    if (publishNow) {
      // Initialize social media clients and publish
      for (const platform of post.platforms) {
        try {
          const socialAccount = await prisma.socialAccount.findFirst({
            where: {
              userId: req.user.id,
              platform: platform.platform.toLowerCase()
            }
          });

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

          // Initialize client for the platform
          const client = await SocialMediaManager.initializeClient(platform.platform, {
            accessToken: socialAccount.accessToken,
            accessSecret: socialAccount.refreshToken,
            username: socialAccount.username
          });

          // Publish the content
          const result = await SocialMediaManager.publishContent(platform.platform, client, {
            caption: `${post.caption} ${post.hashtags}`.trim(),
            mediaFiles: post.mediaFiles
          });
          // Update the platform status and add analytics
          await prisma.postPlatform.update({
            where: { id: platform.id },
            data: {
              status: 'published',
              publishedAt: new Date(),
              externalId: result.id,
              error: null
            }
          });
          // Create initial analytics record
          await prisma.analytics.create({
            data: {
              userId: req.user.id,
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
    }

    // Return the created post with all related data
    const createdPost = await prisma.post.findUnique({
      where: { id: post.id },
      include: {
        mediaFiles: true,
        platforms: {
          include: {
            analytics: true
          }
        }
      }
    });

    res.status(201).json(createdPost);
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Media upload endpoint
app.post('/api/media/upload', authenticateToken, multer().single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate unique filename
    const uniqueId = uuidv4();
    const fileExtension = path.extname(req.file.originalname);
    const filename = `${uniqueId}${fileExtension}`;
    const b2Key = `uploads/${filename}`;

    // Upload file to B2
    const b2Url = await uploadToB2(
      req.file.buffer,
      req.file.mimetype,
      filename
    );

    // Create media file record in database
    const mediaFile = await prisma.mediaFile.create({
      data: {
        userId: req.user.id,
        url: b2Url,
        type: req.file.mimetype.startsWith('image/') ? 'image' : 'video',
        filename: filename,
        size: req.file.size,
        s3Key: b2Key // We'll keep the column name as s3Key for now to avoid migration
      }
    });

    res.status(201).json(mediaFile);
  } catch (error) {
    console.error('Media upload error:', error);

    // If there was an error and we uploaded to B2, clean up
    if (error.b2Key) {
      await deleteFromB2(error.b2Key).catch(console.error);
    }

    res.status(500).json({ error: 'Failed to upload media' });
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
          refreshToken: socialAccount.refreshToken,
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

    if (!user.subscription) {
      return res.status(400).json({ error: 'User does not have an active subscription' });
    }

    // Get plan limits
    const planLimits = user.subscription.plan.limits;
    const postsLimit = planLimits.find(limit => limit.name === 'scheduled_posts')?.value || 10;

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
    let daysLeft = 7;
    if (user.subscription.currentPeriodEnd) {
      const endDate = new Date(user.subscription.currentPeriodEnd);
      const now = new Date();
      now.setDate(now.getDate());
      daysLeft = Math.ceil( (new Date(user.subscription.currentPeriodEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
      const now = new Date();

    const daysLimit = planLimits.find(limit => limit.name === 'days_limit')?.value || 7;

    res.json({
      postsUsed: totalPosts,
      postsLimit,
      daysLeft,
      daysLimit,
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