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

    // Create posts with platforms and analytics
    const now = new Date();
    const posts = [];
    const platforms = ['instagram', 'facebook'];
    const captions = [
      'Exciting new product launch! 🚀 #innovation',
      'Behind the scenes at our office 📸 #workplace',
      'Meet our amazing team! 👥 #teamwork',
      'Customer success story 🌟 #testimonial',
      'Tips and tricks for success 💡 #tips',
    ];

    // Create posts for the last 7 days
    for (let i = 0; i < 7; i++) {
      const postDate = new Date(now);
      postDate.setDate(postDate.getDate() - i);

      const post = await prisma.post.create({
        data: {
          userId: users[0].id,
          caption: captions[Math.floor(Math.random() * captions.length)],
          scheduledDate: postDate,
          hashtags: '#social #marketing #business',
          visibility: 'public',
          platforms: {
            create: platforms.map(platform => ({
              platform,
              status: 'published',
              publishedAt: postDate,
            })),
          },
        },
        include: {
          platforms: true,
        },
      });

      // Create analytics for each platform of the post
      for (const platform of post.platforms) {
        await prisma.analytics.create({
          data: {
            userId: users[0].id,
            postPlatformId: platform.id,
            platform: platform.platform,
            date: postDate,
            reach: Math.floor(Math.random() * 1000) + 500,
            impressions: Math.floor(Math.random() * 2000) + 1000,
            engagement: Math.floor(Math.random() * 500) + 100,
            clicks: Math.floor(Math.random() * 300) + 50,
            shares: Math.floor(Math.random() * 100) + 10,
            saves: Math.floor(Math.random() * 50) + 5,
            likes: Math.floor(Math.random() * 800) + 200,
            comments: Math.floor(Math.random() * 100) + 20,
          },
        });
      }

      posts.push(post);
    }

    console.log({
      users: users.length,
      plans: plans.length,
      posts: posts.length,
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