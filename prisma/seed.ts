import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Clean existing data
    await prisma.analytics.deleteMany();
    await prisma.mediaFile.deleteMany();
    await prisma.post.deleteMany();
    await prisma.socialAccount.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.userSettings.deleteMany();
    await prisma.user.deleteMany();

    // Create password hash
    const passwordHash = await bcrypt.hash('123456', 10);

    // Create main user (admin)
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: passwordHash,
        name: 'John Doe',
        subscription: 'gold',
        role: 'ADMIN',
        timezone: 'UTC',
        bio: 'Social media expert and digital marketing specialist',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop'
      }
    });

    // Create user settings
    await prisma.userSettings.create({
      data: {
        userId: adminUser.id,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        language: 'en',
        theme: 'light',
        autoSchedule: true,
        defaultVisibility: 'public'
      }
    });

    // Create team members
    const teamMembers = await Promise.all([
      prisma.teamMember.create({
        data: {
          userId: adminUser.id,
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'EDITOR',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
          lastActive: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
        }
      }),
      prisma.teamMember.create({
        data: {
          userId: adminUser.id,
          name: 'Mike Johnson',
          email: 'mike@example.com',
          role: 'VIEWER',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
          lastActive: new Date()
        }
      })
    ]);

    // Create social accounts
    const socialAccounts = await Promise.all([
      prisma.socialAccount.create({
        data: {
          userId: adminUser.id,
          platform: 'instagram',
          username: 'demo_instagram',
          profileUrl: 'https://instagram.com/demo',
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh',
          followerCount: 12500
        }
      }),
      prisma.socialAccount.create({
        data: {
          userId: adminUser.id,
          platform: 'facebook',
          username: 'demo_facebook',
          profileUrl: 'https://facebook.com/demo',
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh',
          followerCount: 25000
        }
      })
    ]);

    // Create media files
    const mediaFiles = await Promise.all([
      prisma.mediaFile.create({
        data: {
          userId: adminUser.id,
          url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b',
          type: 'image',
          filename: 'summer_collection.jpg',
          size: 1024000,
          s3Key: 'uploads/summer_collection.jpg'
        }
      }),
      prisma.mediaFile.create({
        data: {
          userId: adminUser.id,
          url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
          type: 'image',
          filename: 'product_launch.jpg',
          size: 2048000,
          s3Key: 'uploads/product_launch.jpg'
        }
      })
    ]);

    // Create posts
    const posts = await Promise.all([
      prisma.post.create({
        data: {
          userId: adminUser.id,
          caption: 'Summer Collection Launch! 🌞 #SummerFashion',
          scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          platform: 'instagram',
          hashtags: '#summer #fashion #newcollection',
          visibility: 'public',
          status: 'scheduled',
          engagementRate: 4.2,
          likes: 0,
          comments: 0,
          shares: 0,
          mediaFiles: {
            connect: [{ id: mediaFiles[0].id }]
          }
        }
      }),
      prisma.post.create({
        data: {
          userId: adminUser.id,
          caption: 'New Product Launch! 🎉 #ProductLaunch',
          scheduledDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          platform: 'facebook',
          hashtags: '#launch #newproduct #exciting',
          visibility: 'public',
          status: 'scheduled',
          engagementRate: 3.8,
          likes: 0,
          comments: 0,
          shares: 0,
          mediaFiles: {
            connect: [{ id: mediaFiles[1].id }]
          }
        }
      })
    ]);

    // Create analytics data
    const analyticsData = [];
    const platforms = ['instagram', 'facebook'];
    const now = new Date();

    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      for (const platform of platforms) {
        analyticsData.push({
          userId: adminUser.id,
          date,
          platform,
          reach: Math.floor(Math.random() * 10000) + 5000,
          impressions: Math.floor(Math.random() * 15000) + 7000,
          engagement: Math.floor(Math.random() * 1000) + 500,
          clicks: Math.floor(Math.random() * 500) + 100,
          shares: Math.floor(Math.random() * 200) + 50,
          saves: Math.floor(Math.random() * 100) + 25
        });
      }
    }

    await prisma.analytics.createMany({
      data: analyticsData
    });

    console.log('Seed data created successfully:', {
      user: { id: adminUser.id, email: adminUser.email },
      teamMembers: teamMembers.length,
      socialAccounts: socialAccounts.length,
      mediaFiles: mediaFiles.length,
      posts: posts.length,
      analyticsRecords: analyticsData.length
    });

  } catch (error) {
    console.error('Error seeding database:', error);
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