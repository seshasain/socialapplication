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
import path from 'path';
import { scheduleJob } from 'node-schedule';
import { createTwitterClient, postToTwitter } from './twitter.js';
dotenv.config();

const prisma = new PrismaClient();
const app = express();

// Configure Twitter OAuth client
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY || '',
  appSecret: process.env.TWITTER_API_SECRET || '',
});

// Store OAuth tokens temporarily (in production, use Redis or another session store)
const oauthTokens = new Map();

app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || 'your-secret-key',
    (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      req.user = user;
      next();
    }
  );
};

// Twitter OAuth routes
app.get('/api/auth/twitter', authenticateToken, async (req, res) => {
  try {
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
      throw new Error('Twitter API credentials not configured');
    }

    const { url, oauth_token, oauth_token_secret } =
      await twitterClient.generateAuthLink(
        'http://localhost:5000/api/auth/twitter/callback',
        { linkMode: 'authorize' }
      );

    // Store the OAuth token secret for this session
    oauthTokens.set(oauth_token, {
      oauth_token_secret,
      userId: req.user.id,
    });

    res.json({ authUrl: url });
  } catch (error) {
    console.error('Twitter auth error:', error);
    res
      .status(500)
      .json({ error: 'Failed to initialize Twitter authentication' });
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

    const {
      client: loggedClient,
      accessToken,
      accessSecret,
    } = await client.login(oauth_verifier);
    const twitterUser = await loggedClient.v2.me();

    // Save the Twitter account to the database
    const socialAccount = await prisma.socialAccount.create({
      data: {
        platform: 'twitter',
        accessToken,
        refreshToken: accessSecret,
        username: twitterUser.data.username,
        profileUrl: `https://twitter.com/${twitterUser.data.username}`,
        userId,
      },
    });

    // Clean up stored OAuth token
    oauthTokens.delete(oauth_token);

    // Redirect back to the frontend
    res.redirect(`http://localhost:5173/dashboard?twitter=connected`);
  } catch (error) {
    console.error('Twitter callback error:', error);
    res.redirect(`http://localhost:5173/dashboard?twitter=error`);
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        settings: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data
    const { password, ...userData } = user;
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        settings: {
          create: {}, // Create default settings
        },
      },
      include: {
        settings: true,
      },
    });

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-secret-key'
    );

    // Remove sensitive data
    const { password: _, ...userData } = user;

    res.json({
      token,
      user: userData,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        settings: true,
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-secret-key'
    );

    // Remove sensitive data
    const { password: _, ...userData } = user;

    res.json({
      token,
      user: userData,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Settings endpoints
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: req.user.id },
    });

    if (!settings) {
      // Create default settings if they don't exist
      const defaultSettings = await prisma.userSettings.create({
        data: {
          userId: req.user.id,
        },
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
        ...req.body,
      },
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
        settings: true,
      },
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
    const { timeRange = '7d' } = req.query;
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

    const analytics = await prisma.analytics.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Calculate totals
    const totals = analytics.reduce(
      (acc, curr) => ({
        reach: acc.reach + curr.reach,
        impressions: acc.impressions + curr.impressions,
        engagement: acc.engagement + curr.engagement,
        shares: acc.shares + curr.shares,
      }),
      { reach: 0, impressions: 0, engagement: 0, shares: 0 }
    );

    res.json({
      timeRange,
      analytics,
      totals,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Overview endpoints
app.get('/api/overview/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const totalPosts = await prisma.post.count({
      where: { userId },
    });

    const posts = await prisma.post.findMany({
      where: { userId },
      select: {
        engagementRate: true,
      },
    });

    const avgEngagementRate =
      posts.length > 0
        ? posts.reduce((acc, post) => acc + (post.engagementRate || 0), 0) /
          posts.length
        : 0;

    const socialAccounts = await prisma.socialAccount.findMany({
      where: { userId },
    });

    const totalFollowers = socialAccounts.reduce(
      (acc, account) => acc + (account.followerCount || 0),
      0
    );

    const scheduledPosts = await prisma.post.count({
      where: {
        userId,
        status: 'scheduled',
        scheduledDate: {
          gte: new Date(),
        },
      },
    });

    res.json({
      totalPosts,
      engagementRate: avgEngagementRate,
      totalFollowers,
      scheduledPosts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/overview/upcoming-posts', authenticateToken, async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        userId: req.user.id,
        status: 'scheduled',
        scheduledDate: {
          gte: new Date(),
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
      take: 5,
    });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Social Accounts endpoints
app.get('/api/social-accounts', authenticateToken, async (req, res) => {
  try {
    const accounts = await prisma.socialAccount.findMany({
      where: {
        userId: req.user.id,
      },
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post(
  '/api/social-accounts/connect',
  authenticateToken,
  async (req, res) => {
    try {
      const { platform } = req.body;
      const userId = req.user.id;

      // Check if account already exists
      const existingAccount = await prisma.socialAccount.findFirst({
        where: {
          userId,
          platform: platform.toLowerCase(),
        },
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
          profileUrl: `https://${platform.toLowerCase()}.com/demo`,
        },
      });

      res.json(account);
    } catch (error) {
      console.error('Error connecting social account:', error);
      res.status(500).json({ error: 'Failed to connect social account' });
    }
  }
);

app.delete('/api/social-accounts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const account = await prisma.socialAccount.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await prisma.socialAccount.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error disconnecting social account:', error);
    res.status(500).json({ error: 'Failed to disconnect social account' });
  }
});

app.post('/api/auth/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
      data: { password: hashedPassword },
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
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.subscription === 'free') {
      return res
        .status(404)
        .json({ error: 'No billing information available for free plan' });
    }

    // In a real application, you would fetch this from your payment provider
    const billingInfo = {
      plan: user.subscription,
      status: 'active',
      nextBillingDate: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      amount: user.subscription === 'standard' ? 29.99 : 79.99,
      cardLast4: '4242',
      cardBrand: 'Visa',
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
        userId: req.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
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
      where: { email },
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
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          name
        )}&background=random`,
      },
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
        userId: req.user.id,
      },
    });

    if (!teamMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const updatedMember = await prisma.teamMember.update({
      where: { id },
      data: { role },
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
        userId: req.user.id,
      },
    });

    if (!teamMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    await prisma.teamMember.delete({
      where: { id },
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
  region: process.env.AWS_REGION,
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Store scheduled jobs in memory
const scheduledJobs = new Map();

// Media upload endpoint
app.post(
  '/api/media/upload',
  authenticateToken,
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileData = await saveFile(req.file);

      const mediaFile = await prisma.mediaFile.create({
        data: {
          userId: req.user.id,
          url: fileData.url,
          type: fileData.type.startsWith('image/') ? 'image' : 'video',
          filename: fileData.filename,
          size: fileData.size,
          s3Key: fileData.filename,
          originalName: fileData.originalName,
        },
      });

      res.json(mediaFile);
    } catch (error) {
      console.error('Media upload error:', error);
      await deleteFile(req.file?.filename).catch(console.error);
      res.status(500).json({ error: 'Failed to upload media' });
    }
  }
);

// Create/Schedule post endpoint
app.post('/api/posts', authenticateToken, async (req, res) => {
  console.log('got here');
  try {
    const {
      caption,
      scheduledDate,
      platform,
      hashtags,
      visibility,
      mediaFiles,
      publishNow,
    } = req.body;

    // Validate required fields
    if (!caption || !platform) {
      return res
        .status(400)
        .json({ error: 'Caption and platform are required' });
    }

    // Create post data
    const postData = {
      userId: req.user.id,
      caption,
      platform,
      hashtags: hashtags || '',
      visibility: visibility || 'public',
      status: publishNow ? 'publishing' : 'scheduled',
      scheduledDate: publishNow ? new Date() : new Date(scheduledDate),
      mediaFiles: {
        connect: mediaFiles ? JSON.parse(mediaFiles).map((id) => ({ id })) : [],
      },
    };

    // Create post in database
    const post = await prisma.post.create({
      data: postData,
      include: {
        mediaFiles: true,
        user: {
          include: {
            socialAccounts: true,
          },
        },
      },
    });

    // Handle immediate publishing
    if (publishNow) {
      try {
        const twitterAccount = post.user.socialAccounts.find(
          (account) => account.platform === 'twitter'
        );
        if (!twitterAccount) {
          throw new Error('No connected Twitter account found');
        } else {
          console.log('twitter account reached');
        }

        const twitterClient = createTwitterClient(
          twitterAccount.accessToken,
          twitterAccount.refreshToken
        );

        const tweet = await postToTwitter(twitterClient, {
          caption: `${caption} ${hashtags}`.trim(),
          mediaFiles: post.mediaFiles,
        });

        // Implement your publishing logic here
        // For now, just mark it as published
        await prisma.post.update({
          where: { id: post.id },
          data: { status: 'published', externalPostId: tweet.data.id },
        });
      } catch (error) {
        await prisma.post.update({
          where: { id: post.id },
          data: { status: 'failed', error: error.message },
        });
        throw error;
      }
    } else {
      // Schedule the post
      await schedulePost(post);
    }

    res.status(201).json(post);
  } catch (error) {
    console.error('Post creation error:', error);
    res
      .status(500)
      .json({ error: 'Failed to create post', details: error.message });
  }
});

// Get scheduled posts
app.get('/api/posts/scheduled', authenticateToken, async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        userId: req.user.id,
        status: 'scheduled',
        scheduledDate: {
          gte: new Date(),
        },
      },
      include: {
        mediaFiles: true,
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    res.json(posts);
  } catch (error) {
    console.error('Failed to fetch scheduled posts:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled posts' });
  }
});

// Update post
app.put('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      caption,
      scheduledDate,
      platform,
      hashtags,
      visibility,
      mediaFiles,
    } = req.body;

    // Verify post ownership
    const existingPost = await prisma.post.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        caption,
        scheduledDate: new Date(scheduledDate),
        platform,
        hashtags,
        visibility,
        mediaFiles: {
          set: [],
          connect: mediaFiles
            ? JSON.parse(mediaFiles).map((id) => ({ id }))
            : [],
        },
      },
      include: {
        mediaFiles: true,
      },
    });

    await schedulePost(post);

    res.json(post);
  } catch (error) {
    console.error('Post update error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete post
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify post ownership
    const post = await prisma.post.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }

    // Cancel scheduled job
    cancelScheduledPost(id);

    // Delete the post
    await prisma.post.delete({
      where: { id },
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Post deletion error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});
