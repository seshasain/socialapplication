import { PrismaClient } from '@prisma/client';
import { TRIAL_LIMITS, TRIAL_REFERRAL_CONFIG } from '../config/trial';
import type { PrismaTransactionClient } from '../types/prisma';

const prisma = new PrismaClient();

enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELING = 'CANCELING',
  CANCELLED = 'CANCELLED'
}

export class TrialService {
  async getTrialStatus(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: SubscriptionStatus.TRIAL }
    });

    if (!subscription) {
      return {
        isActive: false,
        daysLeft: 0
      };
    }

    const now = new Date();
    const trialEnd = subscription.trialEnd;

    if (!trialEnd) {
      return {
        isActive: false,
        daysLeft: 0
      };
    }

    const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      isActive: daysLeft > 0,
      daysLeft,
      trialEnd
    };
  }

  async getTrialUsage(userId: string) {
    const [posts, teamMembers, platformStats] = await Promise.all([
      prisma.post.findMany({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        include: {
          platforms: true
        }
      }),
      prisma.teamMember.count({
        where: { userId }
      }),
      prisma.postPlatform.groupBy({
        by: ['platform'],
        where: {
          post: {
            userId,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        },
        _count: {
          _all: true
        }
      })
    ]);

    const platformUsage = platformStats.reduce((acc, stat) => {
      acc[stat.platform] = stat._count._all;
      return acc;
    }, {} as Record<string, number>);

    return {
      postsToday: posts.length,
      totalPosts: await prisma.post.count({ where: { userId } }),
      scheduledPosts: await prisma.post.count({
        where: {
          userId,
          scheduledDate: {
            gt: new Date()
          }
        }
      }),
      lastPostDate: posts[0]?.createdAt,
      teamMembers,
      platformUsage
    };
  }

  async extendTrial(userId: string, days: number, reason: string, tx?: PrismaTransactionClient) {
    const db = tx || prisma;
    
    const subscription = await db.subscription.findFirst({
      where: { userId, status: SubscriptionStatus.TRIAL }
    });

    if (!subscription) {
      throw new Error('No active trial found');
    }

    if (days > TRIAL_LIMITS.maxExtensionDays) {
      throw new Error(`Cannot extend trial by more than ${TRIAL_LIMITS.maxExtensionDays} days`);
    }

    // Create extension request
    const extensionRequest = await db.trialExtensionRequest.create({
      data: {
        userId,
        reason,
        requestedDays: days,
        status: 'pending'
      }
    });

    return extensionRequest;
  }

  async approveExtension(requestId: string, tx?: PrismaTransactionClient) {
    const db = tx || prisma;
    
    const request = await db.trialExtensionRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          include: {
            subscription: true
          }
        }
      }
    });

    if (!request || !request.user.subscription) {
      throw new Error('Invalid extension request');
    }

    const { subscription } = request.user;
    const newTrialEnd = new Date(subscription.trialEnd!.getTime() + request.requestedDays * 24 * 60 * 60 * 1000);

    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        trialEnd: newTrialEnd,
        currentPeriodEnd: newTrialEnd
      }
    });

    return db.trialExtensionRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        reviewedAt: new Date()
      }
    });
  }

  async getLastExtensionRequest(userId: string) {
    return prisma.trialExtensionRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getReferralInfo(userId: string) {
    const referralCount = await prisma.user.count({
      where: {
        referredBy: userId,
        subscription: {
          status: { not: 'cancelled' }
        }
      }
    });

    const daysEarned = Math.min(
      referralCount * TRIAL_REFERRAL_CONFIG.daysPerReferral,
      TRIAL_REFERRAL_CONFIG.maxReferrals * TRIAL_REFERRAL_CONFIG.daysPerReferral
    );

    return {
      referredUsers: referralCount,
      daysEarned,
      maxDaysEarnable: TRIAL_LIMITS.maxReferralExtensionDays,
      referralCode: userId.slice(0, TRIAL_REFERRAL_CONFIG.referralCodeLength)
    };
  }

  async applyReferralExtension(userId: string, tx?: PrismaTransactionClient) {
    const db = tx || prisma;
    
    const referralInfo = await this.getReferralInfo(userId);
    if (referralInfo.daysEarned === 0) {
      return false;
    }

    const subscription = await db.subscription.findFirst({
      where: { userId, status: SubscriptionStatus.TRIAL }
    });

    if (!subscription?.trialEnd) {
      return false;
    }

    const newTrialEnd = new Date(subscription.trialEnd.getTime() + referralInfo.daysEarned * 24 * 60 * 60 * 1000);

    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        trialEnd: newTrialEnd,
        currentPeriodEnd: newTrialEnd
      }
    });

    return true;
  }
} 