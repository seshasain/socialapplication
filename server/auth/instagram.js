import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { IgApiClient } from 'instagram-private-api';

const router = Router();
const prisma = new PrismaClient();

router.post('/instagram/connect', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const ig = new IgApiClient();
    ig.state.generateDevice(username);
    
    // Attempt to login
    await ig.simulate.preLoginFlow();
    const loggedInUser = await ig.account.login(username, password);
    await ig.simulate.postLoginFlow();
    
    // Get user info
    const userInfo = await ig.user.info(loggedInUser.pk);
    
    // Save account
    const socialAccount = await prisma.socialAccount.create({
      data: {
        platform: 'instagram',
        username: userInfo.username,
        profileUrl: `https://instagram.com/${userInfo.username}`,
        accessToken: password, // Note: Store securely in production
        userId: req.user.id,
        followerCount: userInfo.follower_count
      }
    });
    
    res.json({
      success: true,
      account: {
        id: socialAccount.id,
        platform: 'instagram',
        username: userInfo.username,
        followerCount: userInfo.follower_count
      }
    });
  } catch (error) {
    console.error('Instagram connection error:', error);
    res.status(500).json({ error: 'Failed to connect Instagram account' });
  }
});

export default router;