import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Define subscription status enum to match our standardized version
enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELING = 'CANCELING',
  CANCELLED = 'CANCELLED'
}

async function main() {
  try {
    // Clear existing data
    await prisma.analytics.deleteMany();
    await prisma.postPlatform.deleteMany();
    await prisma.post.deleteMany();
    await prisma.mediaFile.deleteMany();
    await prisma.socialAccount.deleteMany();
    await prisma.userSettings.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.planFeature.deleteMany();
    await prisma.planLimit.deleteMany();
    await prisma.plan.deleteMany();
    await prisma.user.deleteMany();

    // Create plans
    const plans = await Promise.all([
      // Trial Plan
      prisma.plan.create({
        data: {
          id: 'trial',
          name: 'trial',
          displayName: 'Free Trial',
          description: '14-day trial with essential features',
          price: 0,
          interval: 'once',
          sortOrder: 0,
          features: {
            create: [
              { name: 'facebook', description: 'Facebook Integration' },
              { name: 'instagram', description: 'Instagram Integration' },
              { name: 'threads', description: 'Threads Integration' },
              { name: 'basic_analytics', description: 'Basic Analytics' },
              { name: 'post_scheduling', description: 'Post Scheduling' },
              { name: 'hashtag_suggestions', description: 'Hashtag Suggestions' }
            ]
          },
          limits: {
            create: [
              { name: 'monthlyPosts', value: 30, type: 'monthly' },
              { name: 'scheduledPosts', value: 10, type: 'total' },
              { name: 'teamMembers', value: 1, type: 'total' },
              { name: 'postsPerPlatform', value: 10, type: 'monthly' }
            ]
          }
        }
      }),
      // Basic Plan ($9.99/month)
      prisma.plan.create({
        data: {
          name: 'basic',
          displayName: 'Basic Plan',
          description: 'Perfect for individuals and small businesses',
          price: 9.99,
          interval: 'monthly',
          sortOrder: 1,
          features: {
            create: [
              { name: 'facebook', included: true },
              { name: 'instagram', included: true },
              { name: 'threads', included: true },
              { name: 'linkedin', included: true },
              { name: 'basic_analytics', included: true },
              { name: 'post_scheduling', included: true },
              { name: 'content_calendar', included: true },
              { name: 'hashtag_suggestions', included: true },
              { name: 'post_metrics', included: true },
              { name: 'content_library', included: true },
            ],
          },
          limits: {
            create: [
              { name: 'monthlyPosts', value: 100 },
              { name: 'scheduledPosts', value: 30 },
              { name: 'teamMembers', value: 2 },
              { name: 'analyticsHistory', value: 30 },
              { name: 'postsPerPlatform', value: 30 },
            ],
          },
        },
      }),
      // Pro Plan ($29.99/month)
      prisma.plan.create({
        data: {
          name: 'pro',
          displayName: 'Pro Plan',
          description: 'For growing businesses and teams',
          price: 29.99,
          interval: 'monthly',
          sortOrder: 2,
          features: {
            create: [
              // Basic platforms
              { name: 'facebook', included: true },
              { name: 'instagram', included: true },
              { name: 'threads', included: true },
              { name: 'linkedin', included: true },
              // Pro platforms
              { name: 'twitter', included: true },
              { name: 'youtube', included: true },
              { name: 'pinterest', included: true },
              { name: 'tiktok', included: true },
              // Basic features
              { name: 'basic_analytics', included: true },
              { name: 'post_scheduling', included: true },
              { name: 'content_calendar', included: true },
              { name: 'hashtag_suggestions', included: true },
              { name: 'post_metrics', included: true },
              { name: 'content_library', included: true },
              // Pro features
              { name: 'advanced_analytics', included: true },
              { name: 'priority_scheduling', included: true },
              { name: 'ai_suggestions', included: true },
              { name: 'team_collaboration', included: true },
              { name: 'priority_support', included: true },
              { name: 'bulk_scheduling', included: true },
            ],
          },
          limits: {
            create: [
              { name: 'monthlyPosts', value: -1 },
              { name: 'scheduledPosts', value: -1 },
              { name: 'teamMembers', value: 10 },
              { name: 'analyticsHistory', value: 365 },
              { name: 'postsPerPlatform', value: -1 },
            ],
          },
        },
      }),
    ]);

    // Create test users
    const users = await Promise.all([
      // 1. Trial User
      prisma.user.create({
        data: {
          email: 'trial@example.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Trial User',
          role: 'USER',
          subscription: {
            create: {
              planId: plans[0].id, // Trial plan
              status: SubscriptionStatus.TRIAL,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
              trialStart: new Date(),
              trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            }
          },
          settings: {
            create: {
              emailNotifications: true,
              pushNotifications: true,
              smsNotifications: false,
              language: 'en',
              theme: 'light',
              autoSchedule: true,
              defaultVisibility: 'public',
            },
          },
        },
      }),
      // 2. Basic User (Active)
      prisma.user.create({
        data: {
          email: 'basic@example.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Basic User',
          role: 'USER',
          subscription: {
            create: {
              planId: plans[1].id,
              status: SubscriptionStatus.ACTIVE,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
          },
          settings: {
            create: {
              emailNotifications: true,
              pushNotifications: true,
              smsNotifications: false,
              language: 'en',
              theme: 'light',
              autoSchedule: true,
              defaultVisibility: 'public',
            },
          },
        },
      }),
      // 3. Pro User (Active)
      prisma.user.create({
        data: {
          email: 'pro@example.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Pro User',
          role: 'USER',
          subscription: {
            create: {
              planId: plans[2].id,
              status: SubscriptionStatus.ACTIVE,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
          },
          settings: {
            create: {
              emailNotifications: true,
              pushNotifications: true,
              smsNotifications: false,
              language: 'en',
              theme: 'light',
              autoSchedule: true,
              defaultVisibility: 'public',
            },
          },
        },
      }),
      // 4. Trial Ended User
      prisma.user.create({
        data: {
          email: 'trialended@example.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Trial Ended User',
          role: 'USER',
          subscription: {
            create: {
              planId: plans[0].id,
              status: SubscriptionStatus.CANCELLED,
              currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              currentPeriodEnd: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
              trialEnd: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000)
            },
          },
          settings: {
            create: {
              emailNotifications: true,
              pushNotifications: true,
              smsNotifications: false,
              language: 'en',
              theme: 'light',
              autoSchedule: true,
              defaultVisibility: 'public',
            },
          },
        },
      }),
      // 5. Plan Ended User (Expired Pro)
      prisma.user.create({
        data: {
          email: 'ex@example.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Expired Pro User',
          role: 'USER',
          subscription: {
            create: {
              planId: plans[2].id,
              status: SubscriptionStatus.CANCELLED,
              currentPeriodStart: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
              currentPeriodEnd: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            },
          },
          settings: {
            create: {
              emailNotifications: true,
              pushNotifications: true,
              smsNotifications: false,
              language: 'en',
              theme: 'light',
              autoSchedule: true,
              defaultVisibility: 'public',
            },
          },
        },
      }),
    ]);

    // Create test social accounts
    const socialAccounts = await Promise.all([
      // Trial user's accounts
      prisma.socialAccount.create({
        data: {
          userId: users[0].id,
          platform: 'instagram',
          username: 'trialuser',
          profileUrl: 'https://instagram.com/trialuser',
          accessToken: 'mock-token',
          accessSecret: 'mock-refresh-token',
          followerCount: 500,
        },
      }),
      // Basic user's accounts
      prisma.socialAccount.create({
        data: {
          userId: users[1].id,
          platform: 'instagram',
          username: 'basicuser',
          profileUrl: 'https://instagram.com/basicuser',
          accessToken: 'mock-token',
          accessSecret: 'mock-refresh-token',
          followerCount: 1500,
        },
      }),
      prisma.socialAccount.create({
        data: {
          userId: users[1].id,
          platform: 'facebook',
          username: 'basicuser',
          profileUrl: 'https://facebook.com/basicuser',
          accessToken: 'mock-token',
          accessSecret: 'mock-refresh-token',
          followerCount: 2000,
        },
      }),
      // Pro user's accounts
      prisma.socialAccount.create({
        data: {
          userId: users[2].id,
          platform: 'instagram',
          username: 'prouser',
          profileUrl: 'https://instagram.com/prouser',
          accessToken: 'mock-token',
          accessSecret: 'mock-refresh-token',
          followerCount: 5000,
        },
      }),
      prisma.socialAccount.create({
        data: {
          userId: users[2].id,
          platform: 'facebook',
          username: 'prouser',
          profileUrl: 'https://facebook.com/prouser',
          accessToken: 'mock-token',
          accessSecret: 'mock-refresh-token',
          followerCount: 7500,
        },
      }),
      prisma.socialAccount.create({
        data: {
          userId: users[2].id,
          platform: 'twitter',
          username: 'prouser',
          profileUrl: 'https://twitter.com/prouser',
          accessToken: 'mock-token',
          accessSecret: 'mock-refresh-token',
          followerCount: 3000,
        },
      }),
    ]);

    console.log('Seed completed successfully:', {
      users: users.length,
      plans: plans.length,
      socialAccounts: socialAccounts.length,
    });

  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  