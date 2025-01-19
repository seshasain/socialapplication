import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
      prisma.plan.create({
        data: {
          name: 'free',
          description: 'Basic features for individuals',
          price: 0,
          interval: 'monthly',
          sortOrder: 1,
          features: {
            create: [
              { name: 'Up to 1 social accounts', included: true },
              { name: 'Basic analytics', included: true },
              { name: 'Manual post scheduling', included: true },
              { name: 'Single user', included: true },
            ],
          },
          limits: {
            create: [
              { name: 'social_accounts', value: 1 },
              { name: 'scheduled_posts', value: 10 },
              { name: 'team_members', value: 1 },
              { name: 'days_limit', value: 7},
              { name: 'total_posts', value: 10},
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
            ],
          },
          limits: {
            create: [
              { name: 'social_accounts', value: 3 },
              { name: 'scheduled_posts', value: 100 },
              { name: 'team_members', value: 5 },
              { name: 'days_limit', value: 30},
              { name: 'total_posts', value: 100},
            ],
          },
        },
      }),
    ]);

    // Create users
    const users = await Promise.all([
      prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: await bcrypt.hash('password123', 10),
          name: 'John Doe',
          role: 'ADMIN',
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
    ]);

    // Create social accounts
    const socialAccounts = await Promise.all([
      prisma.socialAccount.create({
        data: {
          userId: users[0].id,
          platform: 'instagram',
          username: 'johndoe',
          profileUrl: 'https://instagram.com/johndoe',
          accessToken: 'mock-token',
          accessSecret: 'mock-refresh-token',
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
          accessSecret: 'mock-refresh-token',
          followerCount: 2500,
        },
      }),
    ]);

    console.log({
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
  