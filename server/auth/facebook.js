import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/facebook', async (req, res) => {
  try {
    const redirectUri = `${process.env.APP_URL}/api/auth/facebook/callback`;
    const scope = ['pages_manage_posts', 'pages_read_engagement', 'instagram_basic', 'instagram_content_publish'];
    
    const authUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${
      process.env.FACEBOOK_APP_ID
    }&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope.join(',')}`;
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Facebook auth error:', error);
    res.status(500).json({ error: 'Failed to initialize Facebook authentication' });
  }
});

router.get('/facebook/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const redirectUri = `${process.env.APP_URL}/api/auth/facebook/callback`;
    
    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v12.0/oauth/access_token?client_id=${
        process.env.FACEBOOK_APP_ID
      }&client_secret=${
        process.env.FACEBOOK_APP_SECRET
      }&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`
    );
    
    const { access_token } = await tokenResponse.json();
    
    // Get user profile
    const profileResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,name&access_token=${access_token}`
    );
    const profile = await profileResponse.json();
    
    // Save account
    const socialAccount = await prisma.socialAccount.create({
      data: {
        platform: 'facebook',
        accessToken: access_token,
        username: profile.name,
        profileUrl: `https://facebook.com/${profile.id}`,
        userId: req.user.id
      }
    });
    
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?facebook=connected`);
  } catch (error) {
    console.error('Facebook callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?facebook=error`);
  }
});

export default router;