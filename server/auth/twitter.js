import { Router } from 'express';
import { TwitterApi } from 'twitter-api-v2';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/twitter', async (req, res) => {
  try {
    console.log('Initializing Twitter OAuth flow');
    
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
    });

    const authLink = await client.generateAuthLink(
      `${process.env.APP_URL}/api/auth/twitter/callback`,
      { linkMode: 'authorize' }
    );

    // Store the oauth token secret in session
    req.session.oauthToken = authLink.oauth_token;
    req.session.oauthSecret = authLink.oauth_token_secret;

    console.log('Generated Twitter auth link:', {
      hasToken: !!authLink.oauth_token,
      hasUrl: !!authLink.url
    });

    res.json({ authUrl: authLink.url });
  } catch (error) {
    console.error('Twitter auth error:', error);
    res.status(500).json({ 
      error: 'Failed to initialize Twitter authentication',
      details: error.message
    });
  }
});

router.get('/twitter/callback', async (req, res) => {
  try {
    console.log('Processing Twitter OAuth callback');
    
    const { oauth_token, oauth_verifier } = req.query;
    const { oauthToken, oauthSecret } = req.session;

    if (!oauth_token || !oauth_verifier || !oauthToken || !oauthSecret) {
      console.error('Missing OAuth tokens:', {
        hasOAuthToken: !!oauth_token,
        hasOAuthVerifier: !!oauth_verifier,
        hasSessionToken: !!oauthToken,
        hasSessionSecret: !!oauthSecret
      });
      throw new Error('Missing OAuth tokens');
    }

    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: oauthToken,
      accessSecret: oauthSecret,
    });

    const { accessToken, accessSecret, screenName, userId } = 
      await client.login(oauth_verifier);

    console.log('Successfully authenticated Twitter user:', {
      screenName,
      userId,
      hasAccessToken: !!accessToken,
      hasAccessSecret: !!accessSecret
    });

    // Get user profile information
    const userClient = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: accessToken,
      accessSecret: accessSecret,
    });

    const user = await userClient.v2.me();
    
    // Save or update social account
    const socialAccount = await prisma.socialAccount.upsert({
      where: {
        userId_platform: {
          userId: req.user.id,
          platform: 'twitter'
        }
      },
      update: {
        accessToken: accessToken,
        accessSecret: accessSecret,
        username: screenName,
        profileUrl: `https://twitter.com/${screenName}`,
        followerCount: user.data.public_metrics?.followers_count || 0,
        lastUpdated: new Date()
      },
      create: {
        userId: req.user.id,
        platform: 'twitter',
        accessToken: accessToken,
        accessSecret: accessSecret,
        username: screenName,
        profileUrl: `https://twitter.com/${screenName}`,
        followerCount: user.data.public_metrics?.followers_count || 0
      }
    });

    console.log('Saved social account:', {
      id: socialAccount.id,
      platform: socialAccount.platform,
      username: socialAccount.username
    });

    // Clear session OAuth data
    delete req.session.oauthToken;
    delete req.session.oauthSecret;

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?twitter=connected`);
  } catch (error) {
    console.error('Twitter callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?twitter=error`);
  }
});

// Endpoint to check remaining rate limits
router.get('/twitter/rate-limits', async (req, res) => {
  try {
    const { getRemainingRateLimit } = await import('../twitter.js');
    const limits = await getRemainingRateLimit(req.user.id);
    res.json(limits);
  } catch (error) {
    console.error('Failed to get rate limits:', error);
    res.status(500).json({ error: 'Failed to get rate limits' });
  }
});

export default router;