import { PrismaClient, Subscription as PrismaSubscription, Plan as PrismaPlan, UsageRecord, Prisma, SubscriptionStatus } from '@prisma/client';
import { plans } from '../config/plans';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

type SubscriptionWithPlan = PrismaSubscription & {
  plan: PrismaPlan;
};

type PlatformUsage = {
  [platform: string]: number;
};

type PrismaTransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

type SubscriptionWithMetadata = PrismaSubscription & {
  metadata: Prisma.JsonObject | null;
};

type SupportedPlatform = 'instagram' | 'facebook' | 'twitter' | 'linkedin';

export class SubscriptionService {
  private prisma: PrismaClient;
  private readonly TRIAL_DURATION_DAYS = 14;
  private readonly PLATFORM_LIMITS: Record<SupportedPlatform, { postsPerDay: number }> = {
    instagram: { postsPerDay: 3 },
    facebook: { postsPerDay: 5 },
    twitter: { postsPerDay: 10 },
    linkedin: { postsPerDay: 5 }
  };

  constructor() {
    this.prisma = prisma;
  }

  private async getCurrentMonthUsage(subscriptionId: string, platform?: string): Promise<number> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usage = await this.prisma.usageRecord.aggregate({
      where: {
        subscriptionId,
        feature: 'posts',
        recordedAt: {
          gte: new Date(currentMonth + '-01'),
          lt: new Date(new Date(currentMonth + '-01').setMonth(new Date(currentMonth + '-01').getMonth() + 1))
        },
        ...(platform ? { metadata: { path: ['platform'], equals: platform } } : {})
      },
      _sum: {
        quantity: true
      }
    });

    return usage._sum.quantity || 0;
  }

  private async getPlatformUsage(subscriptionId: string): Promise<PlatformUsage> {
    const platforms = Object.keys(this.PLATFORM_LIMITS) as SupportedPlatform[];
    const usage: PlatformUsage = {};

    await Promise.all(
      platforms.map(async (platform) => {
        usage[platform] = await this.getCurrentMonthUsage(subscriptionId, platform);
      })
    );

    return usage;
  }

  async startTrial(userId: string): Promise<void> {
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { userId }
    });

    if (existingSubscription) {
      throw new Error('User already has a subscription');
    }

    const trialStart = new Date();
    const trialEnd = new Date(trialStart);
    trialEnd.setDate(trialEnd.getDate() + this.TRIAL_DURATION_DAYS);

    await this.prisma.subscription.create({
      data: {
        userId,
        planId: 'trial',
        status: SubscriptionStatus.TRIAL,
        currentPeriodStart: trialStart,
        currentPeriodEnd: trialEnd,
        trialStart,
        trialEnd
      }
    });
  }

  async checkTrialEligibility(userId: string): Promise<boolean> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription) return true;
    
    if (subscription.trialStart) return false;
    
    return true;
  }

  async extendTrial(userId: string, days: number): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription || subscription.status !== SubscriptionStatus.TRIAL) {
      throw new Error('No active trial found');
    }

    const newTrialEnd = new Date(subscription.trialEnd!);
    newTrialEnd.setDate(newTrialEnd.getDate() + days);

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        trialEnd: newTrialEnd,
        currentPeriodEnd: newTrialEnd
      }
    });
  }

  async checkPlatformLimits(subscriptionId: string, platform: string): Promise<{
    canPost: boolean;
    remainingPosts: number;
    resetTime?: Date;
  }> {
    const platformConfig = this.PLATFORM_LIMITS[platform as SupportedPlatform];
    if (!platformConfig) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const platformLimit = platformConfig.postsPerDay;
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const dailyUsage = await this.prisma.usageRecord.aggregate({
      where: {
        subscriptionId,
        feature: 'posts',
        recordedAt: {
          gte: todayStart,
          lte: todayEnd
        },
        metadata: {
          path: ['platform'],
          equals: platform
        }
      },
      _sum: {
        quantity: true
      }
    });

    const usedToday = dailyUsage._sum.quantity || 0;
    const remaining = Math.max(0, platformLimit - usedToday);

    return {
      canPost: remaining > 0,
      remainingPosts: remaining,
      resetTime: new Date(todayEnd)
    };
  }

  async getCurrentPlan(userId: string): Promise<PrismaPlan | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: {
        plan: {
          include: {
            features: true,
            limits: true
          }
        }
      }
    });

    return subscription?.plan || null;
  }

  async upgradePlan(
    userId: string,
    planId: string,
    options: {
      preserveUnusedPosts?: boolean;
      transferSettings?: boolean;
      startImmediately?: boolean;
    }
  ): Promise<void> {
    const { preserveUnusedPosts, transferSettings, startImmediately } = options;

    await this.prisma.$transaction(async (tx) => {
      const currentSubscription = await tx.subscription.findUnique({
        where: { userId },
        include: {
          plan: {
            include: {
              features: true,
              limits: true
            }
          }
        }
      });

      if (!currentSubscription) {
        throw new Error('No active subscription found');
      }

      const startDate = startImmediately ? new Date() : new Date(currentSubscription.currentPeriodEnd);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      // Update subscription
      const newSubscription = await tx.subscription.update({
        where: { userId },
        data: {
          planId,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate,
          cancelAtPeriodEnd: false,
          ...(currentSubscription.status === SubscriptionStatus.TRIAL ? {
            trialStart: null,
            trialEnd: null
          } : {})
        }
      });

      if (preserveUnusedPosts && currentSubscription.plan) {
        const currentUsage = await this.getCurrentMonthUsage(currentSubscription.id);
        const currentPlanLimit = plans[currentSubscription.plan.name].limits.monthlyPosts;
        const unusedPosts = Math.max(0, currentPlanLimit - currentUsage);

        if (unusedPosts > 0) {
          await tx.usageRecord.create({
            data: {
              subscriptionId: newSubscription.id,
              feature: 'rollover_posts',
              quantity: unusedPosts,
              metadata: {
                expiresAt: new Date(endDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
              }
            }
          });
        }
      }

      if (transferSettings) {
        await tx.userSettings.update({
          where: { userId },
          data: {} // Preserve existing settings
        });
      }
    });
  }

  async cancelSubscription(userId: string): Promise<void> {
    await this.prisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: true,
        status: SubscriptionStatus.CANCELING
      }
    });
  }

  async reactivateSubscription(userId: string): Promise<void> {
    await this.prisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: false,
        status: SubscriptionStatus.ACTIVE
      }
    });
  }

  async updatePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { paymentMethod: true }
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    await this.prisma.paymentMethod.update({
      where: { subscriptionId: subscription.id },
      data: {
        id: paymentMethodId,
        isDefault: true
      }
    });
  }

  async getUpgradePreview(userId: string, newPlanId: string): Promise<{
    prorated_amount: number;
    next_billing_date: Date;
    unused_time_credit: number;
  }> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true }
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const currentPlan = plans[subscription.plan.name];
    const newPlan = plans[newPlanId];

    if (!newPlan) {
      throw new Error('Invalid plan ID');
    }

    const daysLeft = Math.ceil(
      (new Date(subscription.currentPeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysInMonth = 30;
    const unusedAmount = (currentPlan.price.monthly * daysLeft) / daysInMonth;
    const proratedAmount = Math.max(0, newPlan.price.monthly - unusedAmount);

    return {
      prorated_amount: proratedAmount,
      next_billing_date: subscription.currentPeriodEnd,
      unused_time_credit: unusedAmount
    };
  }

  async upgradeSubscription(userId: string, planId: string): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const currentSubscription = await tx.subscription.findUnique({
        where: { userId },
        include: { plan: true }
      });

      if (!currentSubscription) {
        throw new Error('No subscription found');
      }

      const currentUsage = await this.getCurrentMonthUsage(currentSubscription.id);

      // Create a usage record for the rollover
      await tx.usageRecord.create({
        data: {
          subscriptionId: currentSubscription.id,
          feature: 'rollover_posts',
          quantity: currentUsage,
          metadata: {
            type: 'upgrade_rollover',
            fromPlan: currentSubscription.plan.name,
            toPlan: planId
          }
        }
      });

      // Update subscription
      await tx.subscription.update({
        where: { userId },
        data: {
          planId,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
    });
  }

  async recordUsage(
    subscriptionId: string,
    feature: string,
    quantity: number,
    platform?: string
  ): Promise<void> {
    await this.prisma.usageRecord.create({
      data: {
        subscriptionId,
        feature,
        quantity,
        metadata: platform ? { platform } : {}
      }
    });
  }

  async getUsageStats(subscriptionId: string): Promise<{
    monthlyUsage: number;
    platformUsage: PlatformUsage;
    remainingPosts: number;
    daysUntilReset: number;
  }> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId },
      include: { plan: true }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const monthlyUsage = await this.getCurrentMonthUsage(subscriptionId);
    const platformUsage = await this.getPlatformUsage(subscriptionId);
    const monthlyLimit = plans[subscription.plan.name].limits.monthlyPosts;
    const remainingPosts = Math.max(0, monthlyLimit - monthlyUsage);

    const today = new Date();
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysUntilReset = Math.ceil((monthEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      monthlyUsage,
      platformUsage,
      remainingPosts,
      daysUntilReset
    };
  }

  async handleSubscriptionRenewal(subscriptionId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // If subscription is set to cancel, don't renew
    if (subscription.cancelAtPeriodEnd) {
      await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.CANCELLED,
          currentPeriodEnd: subscription.currentPeriodEnd
        }
      });
      return;
    }

    const newPeriodStart = new Date(subscription.currentPeriodEnd);
    const newPeriodEnd = new Date(newPeriodStart);
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

    await this.prisma.$transaction(async (tx) => {
      // Carry over unused posts if applicable
      const currentUsage = await this.getCurrentMonthUsage(subscriptionId);
      const monthlyLimit = plans[subscription.plan.name].limits.monthlyPosts;
      const unusedPosts = Math.max(0, monthlyLimit - currentUsage);

      if (unusedPosts > 0) {
        await tx.usageRecord.create({
          data: {
            subscriptionId,
            feature: 'rollover_posts',
            quantity: unusedPosts,
            metadata: {
              type: 'monthly_rollover',
              expiresAt: new Date(newPeriodEnd.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
          }
        });
      }

      // Update subscription period
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          currentPeriodStart: newPeriodStart,
          currentPeriodEnd: newPeriodEnd,
          status: SubscriptionStatus.ACTIVE
        }
      });
    });
  }

  async checkUsageLimits(subscriptionId: string): Promise<{
    isNearLimit: boolean;
    percentageUsed: number;
    warningLevel: 'none' | 'warning' | 'critical';
    message?: string;
  }> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const monthlyUsage = await this.getCurrentMonthUsage(subscriptionId);
    const monthlyLimit = plans[subscription.plan.name].limits.monthlyPosts;
    const percentageUsed = (monthlyUsage / monthlyLimit) * 100;

    let warningLevel: 'none' | 'warning' | 'critical' = 'none';
    let message: string | undefined;

    if (percentageUsed >= 90) {
      warningLevel = 'critical';
      message = `You've used ${Math.round(percentageUsed)}% of your monthly post limit. Consider upgrading your plan.`;
    } else if (percentageUsed >= 75) {
      warningLevel = 'warning';
      message = `You've used ${Math.round(percentageUsed)}% of your monthly post limit.`;
    }

    return {
      isNearLimit: percentageUsed >= 75,
      percentageUsed,
      warningLevel,
      message
    };
  }

  async pauseSubscription(userId: string, duration: number): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription) {
      throw new Error('No subscription found');
    }

    if (subscription.status === SubscriptionStatus.CANCELING) {
      throw new Error('Subscription is already being cancelled');
    }

    const pauseStart = new Date();
    const pauseEnd = new Date(pauseStart);
    pauseEnd.setDate(pauseEnd.getDate() + duration);

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        status: SubscriptionStatus.CANCELING,
        pauseStart,
        pauseEnd
      }
    });
  }

  async resumeSubscription(userId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription) {
      throw new Error('No subscription found');
    }

    if (subscription.status !== SubscriptionStatus.CANCELING) {
      throw new Error('Subscription is not paused');
    }

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        pauseStart: null,
        pauseEnd: null
      }
    });
  }

  async handleFailedPayment(subscriptionId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const retryDays = 3;
    const gracePeriodDays = 7;
    const today = new Date();
    const failureDate = today;
    const retryUntil = new Date(today);
    retryUntil.setDate(retryUntil.getDate() + retryDays);
    const gracePeriodEnd = new Date(today);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);

    const metadataUpdate: Prisma.JsonObject = {
      failureDate: failureDate.toISOString(),
      retryUntil: retryUntil.toISOString(),
      gracePeriodEnd: gracePeriodEnd.toISOString(),
      paymentRetryCount: 0
    };

    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.PAST_DUE
      }
    });
  }

  async processFailedSubscriptions(): Promise<void> {
    const pastDueSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.PAST_DUE
      }
    }) as SubscriptionWithMetadata[];

    for (const subscription of pastDueSubscriptions) {
      const metadata = subscription.metadata;
      if (!metadata) continue;

      const gracePeriodEnd = new Date(metadata.gracePeriodEnd as string);
      const today = new Date();

      if (today > gracePeriodEnd) {
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            plan: { connect: { id: 'free' } },
            status: SubscriptionStatus.ACTIVE
          }
        });
      }
    }
  }
} 