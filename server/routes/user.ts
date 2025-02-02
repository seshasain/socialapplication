import express, { Response, Request } from 'express';
import { authenticateUser } from '../middleware/auth';
import prisma from '../lib/prisma';
import asyncHandler from 'express-async-handler';
import { AuthenticatedRequest } from '../types/auth';

const router = express.Router();

// Get user usage statistics
router.get('/usage', authenticateUser, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { user } = req as AuthenticatedRequest;

  const [monthlyUsage, subscription] = await Promise.all([
    prisma.monthlyUsage.findFirst({
      where: {
        subscription: {
          userId: user.id
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.subscription.findFirst({
      where: {
        userId: user.id
      },
      include: {
        plan: {
          include: {
            limits: true
          }
        }
      }
    })
  ]);

  if (!subscription || !subscription.plan) {
    res.status(404).json({ error: 'Subscription not found' });
    return;
  }

  const usage = {
    posts: {
      used: monthlyUsage?.postsUsed || 0,
      limit: subscription.plan.limits.find(l => l.name === 'posts')?.value || 0
    },
    storage: {
      used: 0, // Calculate from media files if needed
      limit: subscription.plan.limits.find(l => l.name === 'storage')?.value || 0
    },
    platforms: {
      connected: 0, // Calculate from social accounts if needed
      limit: subscription.plan.limits.find(l => l.name === 'platforms')?.value || 0
    }
  };

  res.json(usage);
}));

export default router; 