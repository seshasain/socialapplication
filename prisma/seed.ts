import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Clear existing data
    await prisma.analytics.deleteMany();
    await prisma.usageRecord.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.feedback.deleteMany();
    await prisma.supportTicket.deleteMany();
    await prisma.paymentMethod.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.planFeature.deleteMany();
    await prisma.planLimit.deleteMany();
    await prisma.plan.deleteMany();
    await prisma.postPlatform.deleteMany();
    await prisma.post.deleteMany();
    await prisma.mediaFile.deleteMany();
    await prisma.socialAccount.deleteMany();
    await prisma.userSettings.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.user.deleteMany();

    // Create plans
    const plans = await Promise.all([
      prisma.plan.create({
        data: {
          name: 'free',
          description: 'Basic features for individuals',
          price: 0,
          interval: 'monthly',
          sortOrder: 1,
          features: {
            create: [
              { name: 'Up to 3 social accounts', included: true },
              { name: 'Basic analytics', included: true },
              { name: 'Manual post scheduling', included: true },
              { name: 'Single user', included: true },
            ],
          },
          limits: {
            create: [
              { name: 'social_accounts', value: 3 },
              { name: 'scheduled_posts', value: 10 },
              { name: 'team_members', value: 1 },
              { name: 'days_limit', value: 7}
            ],
          },
        },
      }),
      prisma.plan.create({
        data: {
          name: 'pro',
          description: 'Advanced features for professionals',
          price: 29.99,
          interval: 'monthly',
          sortOrder: 2,
          features: {
            create: [
              { name: 'Up to 10 social accounts', included: true },
              { name: 'Advanced analytics', included: true },
              { name: 'Auto post scheduling', included: true },
              { name: 'Team collaboration', included: true },
              { name: 'Custom reporting', included: true },
              { name: 'Priority support', included: true },
            ],
          },
          limits: {
            create: [
              { name: 'social_accounts', value: 10 },
              { name: 'scheduled_posts', value: 1000 },
              { name: 'team_members', value: 5 },
              { name: 'days_limit', value: 30}
            ],
          },
        },
      }),
    ]);

    // Create users with subscriptions
    const users = await Promise.all([
      prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: await bcrypt.hash('123456789', 10),
          name: 'John Doe',
          role: 'ADMIN',
          timezone: 'America/New_York',
          subscription: {
            create: {
              planId: plans[1].id,
              status: 'active',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
      prisma.user.create({
        data: {
          email: 'user@example.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Jane Smith',
          role: 'USER',
          timezone: 'UTC',
          settings: {
            create: {
              emailNotifications: true,
              pushNotifications: false,
              smsNotifications: false,
              language: 'en',
              theme: 'dark',
              autoSchedule: false,
              defaultVisibility: 'public',
            },
          },
          subscription: {
            create: {
              planId: plans[0].id,
              status: 'free',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
      }),
    ]);

    // Create social accounts for users
    const socialAccounts = await Promise.all([
      prisma.socialAccount.create({
        data: {
          userId: users[0].id,
          platform: 'instagram',
          username: 'johndoe',
          profileUrl: 'https://instagram.com/johndoe',
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh-token',
          followerCount: 1500,
        },
      }),
      prisma.socialAccount.create({
        data: {
          userId: users[0].id,
          platform: 'facebook',
          username: 'johndoe',
          profileUrl: 'https://facebook.com/johndoe',
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh-token',
          followerCount: 2500,
        },
      }),
    ]);

    // Create analytics data
    const analyticsData = [];
    const platforms = ['instagram', 'facebook', 'twitter'];
    const now = new Date();

    // Generate 30 days of analytics data for each user
    for (const user of users) {
      for (let i = 0; i < 30; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        for (const platform of platforms) {
          analyticsData.push({
            userId: user.id,
            platform,
            date,
            reach: Math.floor(Math.random() * 1000) + 500,
            impressions: Math.floor(Math.random() * 2000) + 1000,
            engagement: Math.floor(Math.random() * 500) + 100,
            clicks: Math.floor(Math.random() * 300) + 50,
            shares: Math.floor(Math.random() * 100) + 10,
            saves: Math.floor(Math.random() * 50) + 5,
            likes: Math.floor(Math.random() * 800) + 200,
            comments: Math.floor(Math.random() * 100) + 20,
          });
        }
      }
    }

    await prisma.analytics.createMany({
      data: analyticsData,
    });

    // Create some posts
    const posts = await Promise.all([
      prisma.post.create({
        data: {
          userId: users[0].id,
          caption: 'Check out our latest product launch! 🚀',
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          hashtags: '#launch #product #innovation',
          visibility: 'public',
          platforms: {
            create: [
              {
                platform: 'instagram',
                status: 'scheduled',
              },
              {
                platform: 'facebook',
                status: 'scheduled',
              },
            ],
          },
        },
      }),
      prisma.post.create({
        data: {
          userId: users[0].id,
          caption: 'Behind the scenes at our office 📸',
          scheduledDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
          hashtags: '#behindthescenes #office #team',
          visibility: 'public',
          platforms: {
            create: [
              {
                platform: 'instagram',
                status: 'scheduled',
              },
            ],
          },
        },
      }),
    ]);

    console.log({
      users: users.length,
      plans: plans.length,
      analytics: analyticsData.length,
      socialAccounts: socialAccounts.length,
      posts: posts.length,
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