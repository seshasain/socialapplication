import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.usageRecord.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.planFeature.deleteMany();
  await prisma.planLimit.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.analytics.deleteMany();
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
        name: 'Free',
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
          ],
        },
      },
    }),
    prisma.plan.create({
      data: {
        name: 'Pro',
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
            { name: 'scheduled_posts', value: 100 },
            { name: 'team_members', value: 5 },
          ],
        },
      },
    }),
    prisma.plan.create({
      data: {
        name: 'Business',
        description: 'Enterprise-grade solution',
        price: 99.99,
        interval: 'monthly',
        sortOrder: 3,
        features: {
          create: [
            { name: 'Unlimited social accounts', included: true },
            { name: 'Advanced analytics', included: true },
            { name: 'AI content suggestions', included: true },
            { name: 'Advanced team roles', included: true },
            { name: 'Custom branding', included: true },
            { name: 'API access', included: true },
            { name: 'Dedicated support', included: true },
          ],
        },
        limits: {
          create: [
            { name: 'social_accounts', value: -1 }, // -1 indicates unlimited
            { name: 'scheduled_posts', value: -1 },
            { name: 'team_members', value: -1 },
          ],
        },
      },
    }),
  ]);

  // Create password hash
  const passwordHash = await bcrypt.hash('123456789', 10);

  // Create users with subscriptions
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: passwordHash,
        name: 'John Doe',
        role: 'ADMIN',
        timezone: 'America/New_York',
        bio: 'Digital Marketing Expert',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        subscription: {
          create: {
            planId: plans[1].id, // Pro plan
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            paymentMethod: {
              create: {
                type: 'card',
                brand: 'visa',
                last4: '4242',
                expiryMonth: 12,
                expiryYear: 2024,
                isDefault: true,
              },
            },
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
        email: 'jane@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Jane Smith',
        role: 'USER',
        timezone: 'Europe/London',
        bio: 'Content Creator',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
        subscription: {
          create: {
            planId: plans[0].id, // Free plan
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
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
      },
    }),
  ]);

  // Create invoices for the pro user
  const proUserSubscription = await prisma.subscription.findFirst({
    where: { userId: users[0].id },
  });

  if (proUserSubscription) {
    await Promise.all([
      prisma.invoice.create({
        data: {
          subscriptionId: proUserSubscription.id,
          amount: 29.99,
          status: 'paid',
          paidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          hostedUrl: 'https://example.com/invoice/1',
          pdfUrl: 'https://example.com/invoice/1/pdf',
        },
      }),
      prisma.invoice.create({
        data: {
          subscriptionId: proUserSubscription.id,
          amount: 29.99,
          status: 'paid',
          paidAt: new Date(),
          hostedUrl: 'https://example.com/invoice/2',
          pdfUrl: 'https://example.com/invoice/2/pdf',
        },
      }),
    ]);
  }

  // Create social accounts
  const socialAccounts = await Promise.all([
    prisma.socialAccount.create({
      data: {
        userId: users[0].id,
        platform: 'instagram',
        username: 'johndoe',
        profileUrl: 'https://instagram.com/johndoe',
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        followerCount: 5000,
      },
    }),
    prisma.socialAccount.create({
      data: {
        userId: users[0].id,
        platform: 'twitter',
        username: 'johndoe',
        profileUrl: 'https://twitter.com/johndoe',
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        followerCount: 3000,
      },
    }),
  ]);

  // Create usage records
  if (proUserSubscription) {
    await Promise.all([
      prisma.usageRecord.create({
        data: {
          subscriptionId: proUserSubscription.id,
          feature: 'scheduled_posts',
          quantity: 45,
          metadata: {
            lastRecorded: new Date().toISOString(),
          },
        },
      }),
      prisma.usageRecord.create({
        data: {
          subscriptionId: proUserSubscription.id,
          feature: 'social_accounts',
          quantity: 2,
          metadata: {
            lastRecorded: new Date().toISOString(),
          },
        },
      }),
    ]);
  }

  // Create media files
  const mediaFiles = await Promise.all([
    prisma.mediaFile.create({
      data: {
        userId: users[0].id,
        url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b',
        type: 'image',
        filename: 'summer_collection.jpg',
        size: 1024000,
        s3Key: 'media/summer_collection.jpg',
      },
    }),
    prisma.mediaFile.create({
      data: {
        userId: users[0].id,
        url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f',
        type: 'image',
        filename: 'winter_collection.jpg',
        size: 1024000,
        s3Key: 'media/winter_collection.jpg',
      },
    }),
  ]);

  // Create posts
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        userId: users[0].id,
        caption: 'Summer Collection Launch! 🌞 #SummerFashion',
        scheduledDate: new Date('2024-11-06T09:43:00.954Z'),
        hashtags: '#summer #fashion #newcollection',
        visibility: 'public',
        mediaFiles: {
          connect: [{ id: mediaFiles[0].id }],
        },
        platforms: {
          create: [
            {
              platform: 'instagram',
              status: 'scheduled',
              settings: {},
            },
            {
              platform: 'twitter',
              status: 'scheduled',
              settings: {},
            },
          ],
        },
      },
    }),
    prisma.post.create({
      data: {
        userId: users[0].id,
        caption: 'Winter Collection Preview ❄️ #WinterFashion',
        scheduledDate: new Date('2024-12-01T10:00:00.000Z'),
        hashtags: '#winter #fashion #preview',
        visibility: 'public',
        mediaFiles: {
          connect: [{ id: mediaFiles[1].id }],
        },
        platforms: {
          create: [
            {
              platform: 'instagram',
              status: 'scheduled',
              settings: {},
            },
          ],
        },
      },
    }),
  ]);

  // Create team members
  const teamMembers = await Promise.all([
    prisma.teamMember.create({
      data: {
        userId: users[0].id,
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        role: 'EDITOR',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      },
    }),
  ]);

  // Create analytics data
  const analytics = await Promise.all([
    prisma.analytics.create({
      data: {
        userId: users[0].id,
        date: new Date('2024-03-01'),
        platform: 'instagram',
        reach: 1500,
        impressions: 2000,
        engagement: 300,
        clicks: 150,
        shares: 50,
        saves: 25,
      },
    }),
    prisma.analytics.create({
      data: {
        userId: users[0].id,
        date: new Date('2024-03-01'),
        platform: 'twitter',
        reach: 1000,
        impressions: 1500,
        engagement: 200,
        clicks: 100,
        shares: 30,
        saves: 15,
      },
    }),
  ]);

  console.log({
    plans: plans.length,
    users: users.length,
    socialAccounts: socialAccounts.length,
    mediaFiles: mediaFiles.length,
    posts: posts.length,
    teamMembers: teamMembers.length,
    analytics: analytics.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });