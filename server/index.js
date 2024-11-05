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

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

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
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        settings: true
      }
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
          create: {} // Create default settings
        }
      },
      include: {
        settings: true
      }
    });

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-secret-key'
    );

    // Remove sensitive data
    const { password: _, ...userData } = user;

    res.json({
      token,
      user: userData
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
        settings: true
      }
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
      user: userData
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
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
  console.log(req.user.id);
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
    // Use .toISOString() to convert to UTC (ISO 8601 format)
    const startDateISOString = startDate.toISOString();
    const endDateISOString = endDate.toISOString();
    console.log(startDateISOString, endDateISOString);
    const analytics = await prisma.analytics.findMany({
      where: {
        userId,
        date: {
          gte: startDateISOString,
          lte: endDateISOString
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    console.log('Analytics:', analytics);

    // Handle no results
    if (analytics.length === 0) {
      return res.json({
        timeRange,
        analytics: [],
        totals: { reach: 0, impressions: 0, engagement: 0, shares: 0 }
      });
    }

    // Calculate totals
    const totals = analytics.reduce((acc, curr) => ({
      reach: acc.reach + curr.reach,
      impressions: acc.impressions + curr.impressions,
      engagement: acc.engagement + curr.engagement,
      shares: acc.shares + curr.shares
    }), { reach: 0, impressions: 0, engagement: 0, shares: 0 });

    res.json({
      timeRange,
      analytics,
      totals
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Overview endpoints
app.get('/api/overview/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total posts
    const totalPosts = await prisma.post.count({
      where: { userId }
    });

    // Calculate engagement rate from analytics
    const analytics = await prisma.analytics.findMany({
      where: { userId },
      select: {
        engagement: true,
        impressions: true
      }
    });

    const avgEngagementRate = analytics.length > 0
      ? analytics.reduce((acc, curr) => acc + (curr.engagement / Math.max(curr.impressions, 1)), 0) / analytics.length
      : 0;

    // Get total followers from social accounts
    const socialAccounts = await prisma.socialAccount.findMany({
      where: { userId },
      select: {
        followerCount: true
      }
    });

    const totalFollowers = socialAccounts.reduce((acc, account) => acc + (account.followerCount || 0), 0);

    // Get scheduled posts count
    const scheduledPosts = await prisma.post.count({
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
      }
    });

    res.json({
      totalPosts,
      engagementRate: avgEngagementRate,
      totalFollowers,
      scheduledPosts
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch overview stats' });
  }
});

app.get('/api/overview/upcoming-posts', authenticateToken, async (req, res) => {
  try {
    // Get scheduled posts count
    const posts = await prisma.post.findMany({
      where: {
        userId: req.user.id,
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
        mediaFiles: {
          select: {
            id: true,
            url: true,
            type: true
          }
        },
        platforms: {
          select: {
            id: true,
            platform: true,
            status: true,
            publishedAt: true
          }
        }
      },
      orderBy: {
        scheduledDate: 'asc'
      },
      take: 5
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
        userId: req.user.id
      }
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

});
// Social Accounts endpoints
app.delete('/api/social-accounts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const account = await prisma.socialAccount.delete({
      where: {
        id: id, // Use the ID to find the account
        userId: req.user.id, // Ensure it belongs to the user
      },
    }
    )
  } catch (error) {
    res.status(500).json({ error: error.message });
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
  }
});

// Store scheduled jobs in memory
const scheduledJobs = new Map();

// Media upload endpoint
app.post('/api/media/upload', authenticateToken, upload.single('file'), async (req, res) => {
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
        originalName: fileData.originalName
      }
    });

    res.json(mediaFile);
  } catch (error) {
    console.error('Media upload error:', error);
    await deleteFile(req.file?.filename).catch(console.error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
});


/// Delete post endpoint
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


// Update the post creation endpoint to handle multiple platforms
app.post('/api/posts', authenticateToken, async (req, res) => {
  try {
    const {
      caption,
      scheduledDate,
      platforms,
      hashtags,
      visibility,
      mediaFiles,
      publishNow,
    } = req.body;

    if (!caption || !platforms) {
      return res.status(400).json({ error: 'Caption and platforms are required' });
    }

    const selectedPlatforms = JSON.parse(platforms);

    // Create post
    const postData = {
      userId: req.user.id,
      caption,
      scheduledDate: publishNow ? new Date() : new Date(scheduledDate),
      hashtags: hashtags || '',
      visibility: visibility || 'public',
      platforms: {
        create: selectedPlatforms.map(platform => ({
          platform,
          status: publishNow ? 'publishing' : 'scheduled',
          settings: {}
        }))
      }
    };

    if (mediaFiles) {
      const mediaFileIds = JSON.parse(mediaFiles);
      if (Array.isArray(mediaFileIds) && mediaFileIds.length > 0) {
        postData.mediaFiles = {
          connect: mediaFileIds.map(id => ({ id }))
        };
      }
    }

    // Create post with initial analytics entries
    const post = await prisma.post.create({
      data: {
        ...postData,
        analytics: {
          create: selectedPlatforms.map(platform => ({
            userId: req.user.id,
            platform: platform.toLowerCase(),
            date: new Date(),
            reach: 0,
            impressions: 0,
            engagement: 0,
            clicks: 0,
            shares: 0,
            saves: 0
          }))
        }
      },
      include: {
        mediaFiles: true,
        platforms: true,
        analytics: true,
        user: {
          include: {
            socialAccounts: true
          }
        }
      }
    });

    if (publishNow) {
      // For each platform, try to publish content
      for (const platformData of post.platforms) {
        const socialAccount = post.user.socialAccounts.find(
          account => account.platform.toLowerCase() === platformData.platform.toLowerCase()
        );

        if (!socialAccount) {
          // If no social account found, update the platform status to failed
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
          // Initialize client for the platform
          const client = await SocialMediaManager.initializeClient(platformData.platform, {
            accessToken: socialAccount.accessToken,
            accessSecret: socialAccount.refreshToken,
            username: socialAccount.username
          });

          // Publish the content on the platform
          const result = await SocialMediaManager.publishContent(
            platformData.platform,
            client,
            {
              caption: `${caption} ${hashtags}`.trim(),
              mediaFiles: post.mediaFiles
            }
          );

          // Update the platform status after successful publishing
          await prisma.postPlatform.update({
            where: { id: platformData.id },
            data: {
              status: 'published',
              publishedAt: new Date(),
              externalId: result.id
            }
          });

        } catch (error) {
          console.log(error);
          // If an error occurs during publishing, update the platform status to failed
          await prisma.postPlatform.update({
            where: { id: platformData.id },
            data: {
              status: 'failed',
              error: `Failed to publish content on ${platformData.platform}: ${error.message}`
            }
          });
        }
      }

      // After attempting to publish all platforms, update the post status based on the platform statuses
      const updatedPlatforms = await prisma.postPlatform.findMany({
        where: { postId: post.id }
      });

      const allPublished = updatedPlatforms.every(p => p.status === 'published');
      const allFailed = updatedPlatforms.every(p => p.status === 'failed');

      // Only update the `error` field on the post if all platforms failed
      await prisma.post.update({
        where: { id: post.id },
        data: {
          error: allFailed ? 'Failed to publish to all platforms' : null
        }
      });

    } else {
      // If not publishing immediately, schedule the post
      await schedulePost(post);
    }

    res.status(201).json(post);
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

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



// Retry failed post endpoint
app.post('/api/posts/retry/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get the post with all related data
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        mediaFiles: true,
        platforms: true,
        analytics: true,
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

    // Reset analytics for failed platforms
    const failedPlatforms = post.platforms.filter(p => p.status === 'failed');

    for (const platform of failedPlatforms) {
      // Delete existing analytics for failed platform
      await prisma.analytics.deleteMany({
        where: {
          postId: post.id,
          platform: platform.platform.toLowerCase()
        }
      });

      // Create new analytics entry
      await prisma.analytics.create({
        data: {
          userId: post.userId,
          postId: post.id,
          platform: platform.platform.toLowerCase(),
          date: new Date(),
          reach: 0,
          impressions: 0,
          engagement: 0,
          clicks: 0,
          shares: 0,
          saves: 0
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

      try {
        const client = await SocialMediaManager.initializeClient(platform.platform, {
          accessToken: socialAccount.accessToken,
          accessSecret: socialAccount.refreshToken,
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

    // Update main post status
    const updatedPlatforms = await prisma.postPlatform.findMany({
      where: { postId: post.id }
    });

    const allPublished = updatedPlatforms.every(p => p.status === 'published');
    const allFailed = updatedPlatforms.every(p => p.status === 'failed');

    await prisma.post.update({
      where: { id: post.id },
      data: {
        status: allPublished ? 'published' : allFailed ? 'failed' : 'partial',
        error: allFailed ? 'Failed to publish to all platforms' : null
      }
    });

    const updatedPost = await prisma.post.findUnique({
      where: { id },
      include: {
        mediaFiles: true,
        platforms: true,
        analytics: true
      }
    });

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error('Post retry error:', error);
    res.status(500).json({ error: 'Failed to retry post' });
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

