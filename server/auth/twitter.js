import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { TwitterApi } from 'twitter-api-v2';

const router = Router();
const prisma = new PrismaClient();

router.get('/twitter', async (req, res) => {
  try {
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
    });

    const authLink = await client.generateAuthLink(
      `${process.env.APP_URL}/api/auth/twitter/callback`
    );

    // Store the oauth token secret in session
    req.session.oauthToken = authLink.oauth_token;
    req.session.oauthSecret = authLink.oauth_token_secret;

    res.json({ authUrl: authLink.url });
  } catch (error) {
    console.error('Twitter auth error:', error);
    res.status(500).json({ error: 'Failed to initialize Twitter authentication' });
  }
});

router.get('/twitter/callback', async (req, res) => {
  try {
    const { oauth_token, oauth_verifier } = req.query;
    const { oauthToken, oauthSecret } = req.session;

    if (!oauth_token || !oauth_verifier || !oauthToken || !oauthSecret) {
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

    // Save account
    const socialAccount = await prisma.socialAccount.create({
      data: {
        platform: 'twitter',
        accessToken: accessToken,
        accessSecret: accessSecret, // Make sure to store this!
        username: screenName,
        profileUrl: `https://twitter.com/${screenName}`,
        userId: req.user.id
      }
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?twitter=connected`);
  } catch (error) {
    console.error('Twitter callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?twitter=error`);
  }
});

export default router;
