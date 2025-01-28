import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';

const prisma = new PrismaClient();

enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELING = 'CANCELING',
  CANCELLED = 'CANCELLED'
}

async function processMonthlyRollover() {
  try {
    console.log('Starting monthly rollover process...');

    // Get all active subscriptions with their related data
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE
      },
      include: {
        plan: {
          include: {
            limits: true
          }
        }
      }
    });

    for (const subscription of subscriptions) {
      try {
        const monthlyPostLimit = subscription.plan.limits.find(l => l.name === 'monthlyPosts')?.value;
        if (!monthlyPostLimit) continue;

        // Get current month's usage
        const currentUsage = await (prisma as any).monthlyUsage.findFirst({
          where: {
            subscriptionId: subscription.id,
            monthYear: new Date().toISOString().slice(0, 7)
          }
        });

        if (!currentUsage) continue;

        // Convert monthlyPostLimit to number since it's stored as string
        const monthlyPostLimitNum = parseInt(String(monthlyPostLimit));
        const unusedPosts = Math.max(0, monthlyPostLimitNum - currentUsage.postsUsed);
        
        // Get rollover limits based on plan and ensure string type
        const maxRollover = subscription.plan.limits.find(l => l.name === 'maxRollover')?.value || '0';
        const maxRolloverNum = parseInt(String(maxRollover));
        const rolloverAmount = Math.min(unusedPosts, maxRolloverNum).toString();

        if (parseInt(rolloverAmount) > 0) {
          // Set expiry to end of next month
          const expiryDate = new Date();
          expiryDate.setMonth(expiryDate.getMonth() + 2, 0); // Last day of next month
          expiryDate.setHours(23, 59, 59, 999);

          // Check if rollover record exists
          const existingRollover = await (prisma as any).rolloverPosts.findUnique({
            where: { subscriptionId: subscription.id }
          });

          const rolloverData = {
            amount: rolloverAmount,
            expiresAt: expiryDate
          };

          if (existingRollover) {
            await (prisma as any).rolloverPosts.update({
              where: { subscriptionId: subscription.id },
              data: rolloverData
            });
          } else {
            await (prisma as any).rolloverPosts.create({
              data: {
                subscriptionId: subscription.id,
                ...rolloverData
              }
            });
          }

          console.log(`Processed rollover for subscription ${subscription.id}: ${rolloverAmount} posts`);
        }
      } catch (error) {
        console.error(`Error processing rollover for subscription ${subscription.id}:`, error);
      }
    }

    console.log('Monthly rollover process completed');
  } catch (error) {
    console.error('Error in monthly rollover process:', error);
  }
}

// Run at 00:00 on the first day of each month
export function startRolloverCron() {
  cron.schedule('0 0 1 * *', processMonthlyRollover);
  console.log('Monthly rollover cron job scheduled');
} 