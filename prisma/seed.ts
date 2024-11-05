import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.analytics.deleteMany();
  await prisma.postPlatform.deleteMany();
  await prisma.post.deleteMany();
  await prisma.mediaFile.deleteMany();
  await prisma.socialAccount.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.user.deleteMany();

  // Create password hash
  const passwordHash = await bcrypt.hash('123456789', 10);

  // Create users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        //id: 'cm34ifpf30002sujn9pt8wyus',
        email: 'admin@example.com',
        password: passwordHash,
        name: 'John Doe',
        role: 'ADMIN',
        subscription: 'premium',
        timezone: 'America/New_York',
        bio: 'Digital Marketing Expert',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
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
        role: 'USER',
        subscription: 'free',
        timezone: 'Europe/London',
        bio: 'Content Creator',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
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

  // Create posts without the removed fields
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
