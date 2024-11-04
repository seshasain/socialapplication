import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/linkedin', async (req, res) => {
  try {
    const redirectUri = `${process.env.APP_URL}/api/auth/linkedin/callback`;
    const scope = ['r_liteprofile', 'w_member_social'];
    
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${
      process.env.LINKEDIN_CLIENT_ID
    }&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope.join('%20')}`;
    
    res.json({ authUrl });
  } catch (error) {
    console.error('LinkedIn auth error:', error);
    res.status(500).json({ error: 'Failed to initialize LinkedIn authentication' });
  }
});

router.get('/linkedin/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const redirectUri = `${process.env.APP_URL}/api/auth/linkedin/callback`;
    
    // Exchange code for access token
    const tokenResponse = await fetch(
      'https://www.linkedin.com/oauth/v2/accessToken',
      {
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
      }
    );
    
    const { access_token } = await tokenResponse.json();
    
    // Get user profile
    const profileResponse = await fetch(
      'https://api.linkedin.com/v2/me',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    const profile = await profileResponse.json();
    
    // Save account
    const socialAccount = await prisma.socialAccount.create({
      data: {
        platform: 'linkedin',
        accessToken: access_token,
        username: `${profile.localizedFirstName} ${profile.localizedLastName}`,
        profileUrl: `https://linkedin.com/in/${profile.id}`,
        userId: req.user.id
      }
    });
    
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?linkedin=connected`);
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?linkedin=error`);
  }
});

export default router;