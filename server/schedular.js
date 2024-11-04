import schedule from 'node-schedule';
import { PrismaClient } from '@prisma/client';
import { createTwitterClient, postToTwitter } from './twitter.js';

const prisma = new PrismaClient();
const scheduledJobs = new Map();

export const schedulePost = async (post) => {
  try {
    // Cancel existing job if it exists
    if (scheduledJobs.has(post.id)) {
      scheduledJobs.get(post.id).cancel();
    }

    // Schedule new job for each platform
    const job = schedule.scheduleJob(new Date(post.scheduledDate), async () => {
      try {
        for (const platformData of post.platforms) {
          const socialAccount = post.user.socialAccounts.find(
            account => account.platform.toLowerCase() === platformData.platform.toLowerCase()
          );

          if (!socialAccount) {
            await prisma.postPlatform.update({
              where: { id: platformData.id },
              data: {
                status: 'failed',
                error: `No connected ${platformData.platform} account found`
              }
            });
            continue;
          }

          try {
            switch (platformData.platform.toLowerCase()) {
              case 'twitter':
                const client = createTwitterClient(
                  socialAccount.accessToken,
                  socialAccount.refreshToken
                );
                const result = await postToTwitter(client, {
                  caption: `${post.caption} ${post.hashtags}`.trim(),
                  mediaFiles: post.mediaFiles,
                });
                
                await prisma.postPlatform.update({
                  where: { id: platformData.id },
                  data: {
                    status: 'published',
                    publishedAt: new Date(),
                    externalId: result.id
                  }
                });
                break;
              default:
                await prisma.postPlatform.update({
                  where: { id: platformData.id },
                  data: {
                    status: 'pending',
                    error: 'Platform publishing not implemented'
                  }
                });
            }
          } catch (error) {
            await prisma.postPlatform.update({
              where: { id: platformData.id },
              data: {
                status: 'failed',
                error: error.message
              }
            });
          }
        }

        // Update main post status based on platform statuses
        const updatedPlatforms = await prisma.postPlatform.findMany({
          where: { postId: post.id }
        });

        const allPublished = updatedPlatforms.every(p => p.status === 'published');
        const allFailed = updatedPlatforms.every(p => p.status === 'failed');

        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: allPublished ? 'published' : allFailed ? 'failed' : 'partial',
            error: allFailed ? 'Failed to publish to all platforms' : null
          }
        });
      } catch (error) {
        console.error(`Failed to publish scheduled post ${post.id}:`, error);
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: 'failed',
            error: error.message
          }
        });
      }
    });

    scheduledJobs.set(post.id, job);
    console.log(`Job Scheduled for post ${post.id}`);
    return job;
  } catch (error) {
    console.error('Error scheduling post:', error);
    throw error;
  }
};

export const cancelScheduledPost = async (postId) => {
  try {
    if (scheduledJobs.has(postId)) {
      const job = scheduledJobs.get(postId);
      job.cancel();
      scheduledJobs.delete(postId);
      console.log(`Scheduled job cancelled for post ${postId}`);
    }
  } catch (error) {
    console.error(`Error cancelling scheduled post ${postId}:`, error);
    throw error;
  }
};

export { scheduledJobs };