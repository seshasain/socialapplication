import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';
import { SubscriptionService } from '../services/subscription.service';

interface PlatformUsageData {
  used: number;
  remaining: number;
  total: number;
}

interface MonthlyUsage {
  id: string;
  subscriptionId: string;
  monthYear: string;
  postsUsed: number;
  postsRemaining: number;
  platformUsage: Record<string, number>;
}

interface RolloverPosts {
  amount: string;
  expiresAt: Date;
}

const router = Router();
const prisma = new PrismaClient();
const subscriptionService = new SubscriptionService();

// Type-safe middleware wrapper
const typedHandler = (
  handler: (req: AuthenticatedRequest, res: Response) => Promise<void>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req as AuthenticatedRequest, res);
    } catch (error) {
      next(error);
    }
  };
};

// Get usage statistics
router.get('/stats', authenticateUser, typedHandler(async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;

    // Get user's subscription and plan
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: {
        plan: {
          include: {
            limits: true
          }
        }
      }
    });

    if (!subscription) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }

    // Get monthly usage
    const currentMonthYear = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyUsage = await (prisma as any).monthlyUsage.findFirst({
      where: {
        subscriptionId: subscription.id,
        monthYear: currentMonthYear
      }
    }) as MonthlyUsage | null;

    // Get rollover posts
    const rolloverPosts = await (prisma as any).rolloverPosts.findUnique({
      where: {
        subscriptionId: subscription.id
      }
    }) as RolloverPosts | null;

    // Get plan limits
    const monthlyPostLimit = String(subscription.plan.limits.find(l => l.name === 'monthlyPosts')?.value || '0');
    const scheduledPostLimit = String(subscription.plan.limits.find(l => l.name === 'scheduledPosts')?.value || '0');
    const perPlatformLimit = String(subscription.plan.limits.find(l => l.name === 'postsPerPlatform')?.value || '0');

    // Get scheduled posts count
    const scheduledPosts = await prisma.post.count({
      where: {
        userId,
        scheduledDate: {
          gt: new Date()
        }
      }
    });

    // Calculate remaining posts including rollover
    const rolloverAmount = parseInt(rolloverPosts?.amount || '0');
    const totalAvailablePosts = parseInt(monthlyPostLimit) + rolloverAmount;
    const postsUsed = monthlyUsage?.postsUsed || 0;
    const remainingPosts = Math.max(0, totalAvailablePosts - postsUsed);

    // Format platform-specific usage
    const platformUsage: Record<string, PlatformUsageData> = {};
    if (monthlyUsage?.platformUsage) {
      Object.entries(monthlyUsage.platformUsage).forEach(([platform, used]) => {
        const limit = parseInt(perPlatformLimit);
        platformUsage[platform] = {
          used,
          remaining: Math.max(0, limit - used),
          total: limit
        };
      });
    }

    res.json({
      monthlyPosts: {
        used: postsUsed,
        remaining: remainingPosts,
        total: totalAvailablePosts
      },
      platformPosts: platformUsage,
      scheduledPosts: {
        used: scheduledPosts,
        remaining: Math.max(0, parseInt(scheduledPostLimit) - scheduledPosts),
        total: parseInt(scheduledPostLimit)
      },
      rolloverPosts: rolloverPosts ? {
        amount: rolloverPosts.amount,
        expiresAt: rolloverPosts.expiresAt
      } : null
    });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({ error: 'Failed to fetch usage statistics' });
  }
}));

// Track post usage
router.post('/track', authenticateUser, typedHandler(async (req, res) => {
  const { platforms, postType, count } = req.body;
  const userId = (req as AuthenticatedRequest).user.id;

  try {
    // Start a transaction
    await prisma.$transaction(async (tx) => {
      // Get user's subscription
      const subscription = await tx.subscription.findUnique({
        where: { userId },
        include: {
          plan: {
            include: {
              limits: true
            }
          }
        }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Get or create monthly usage record
      const monthYear = new Date().toISOString().slice(0, 7); // YYYY-MM
      let monthlyUsage = await (tx as any).monthlyUsage.findFirst({
        where: {
          subscriptionId: subscription.id,
          monthYear
        }
      }) as MonthlyUsage | null;

      const monthlyPostLimit = subscription.plan.limits.find(l => l.name === 'monthlyPosts')?.value || '0';

      if (!monthlyUsage) {
        monthlyUsage = await (tx as any).monthlyUsage.create({
          data: {
            subscriptionId: subscription.id,
            monthYear,
            postsUsed: 0,
            postsRemaining: parseInt(String(monthlyPostLimit)),
            platformUsage: {}
          }
        }) as MonthlyUsage;
      }

      // Update platform-specific usage
      const platformUsage = { ...monthlyUsage.platformUsage };
      platforms.forEach((platform: string) => {
        platformUsage[platform] = (platformUsage[platform] || 0) + 1;
      });

      // Update monthly usage
      await (tx as any).monthlyUsage.update({
        where: { id: monthlyUsage.id },
        data: {
          postsUsed: monthlyUsage.postsUsed + count,
          platformUsage
        }
      });

      // Create usage record
      await tx.usageRecord.create({
        data: {
          subscriptionId: subscription.id,
          feature: 'posts',
          quantity: count,
          metadata: {
            platforms,
            postType
          }
        }
      });
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking usage:', error);
    res.status(500).json({ error: 'Failed to track usage' });
  }
}));

export default router; 