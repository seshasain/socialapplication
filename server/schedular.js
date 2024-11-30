import schedule from 'node-schedule';
import { PrismaClient } from '@prisma/client';
import { createTwitterClient, postToTwitter } from './twitter.js';
import { createFacebookClient, postToFacebook } from './facebook.js';
import { createInstagramClient, authenticateInstagram, postToInstagram } from './instagram.js';
import { createLinkedInClient, postToLinkedIn } from './linkedin.js';

const prisma = new PrismaClient();
const scheduledJobs = new Map();

export const schedulePost = async (post) => {
  console.log('Scheduling post:', post.id);
  try {
    // Cancel existing job if it exists
    if (scheduledJobs.has(post.id)) {
      console.log('Cancelling existing job for post:', post.id);
      scheduledJobs.get(post.id).cancel();
    }

    // Schedule new job for each platform
    const job = schedule.scheduleJob(new Date(post.scheduledDate), async () => {
      console.log('Executing scheduled post:', post.id);
      try {
        for (const platformData of post.platforms) {
          console.log(`Processing platform ${platformData.platform} for post ${post.id}`);
          
          const socialAccount = await prisma.socialAccount.findFirst({
            where: {
              userId: post.userId,
              platform: platformData.platform
            }
          });

          if (!socialAccount) {
            console.error(`No connected ${platformData.platform} account found for post ${post.id}`);
            await prisma.postPlatform.update({
              where: { id: platformData.id },
              data: {
                status: 'failed',
                error: `No connected ${platformData.platform} account found`,
              },
            });
            continue;
          }

          try {
            console.log(`Publishing to ${platformData.platform} for post ${post.id}`);
            const postContent = {
              caption: `${post.caption} ${post.hashtags}`.trim(),
              mediaFiles: post.mediaFiles || []
            };

            let result;
            switch (platformData.platform.toLowerCase()) {
              case 'twitter':
                const twitterClient = createTwitterClient(
                  socialAccount.accessToken,
                  socialAccount.refreshToken
                );
                result = await postToTwitter(twitterClient, postContent);
                break;

              case 'facebook':
                const fbClient = createFacebookClient(socialAccount.accessToken);
                result = await postToFacebook(fbClient, postContent);
                break;

              case 'instagram':
                const igClient = createInstagramClient(socialAccount.username, socialAccount.accessToken);
                await authenticateInstagram(igClient, socialAccount.username, socialAccount.accessToken);
                result = await postToInstagram(igClient, postContent);
                break;

              case 'linkedin':
                const linkedinClient = createLinkedInClient(socialAccount.accessToken);
                result = await postToLinkedIn(linkedinClient, postContent);
                break;

              default:
                throw new Error(`Unsupported platform: ${platformData.platform}`);
            }

            console.log(`Successfully published to ${platformData.platform} for post ${post.id}`, result);

            await prisma.postPlatform.update({
              where: { id: platformData.id },
              data: {
                status: 'published',
                publishedAt: new Date(),
                externalId: result.id || result.postId,
              },
            });
          } catch (error) {
            console.error(`Failed to publish to ${platformData.platform} for post ${post.id}:`, error);
            await prisma.postPlatform.update({
              where: { id: platformData.id },
              data: {
                status: 'failed',
                error: error.message,
              },
            });
          }
        }

        // Update main post status based on platform statuses
        const updatedPlatforms = await prisma.postPlatform.findMany({
          where: { postId: post.id },
        });

        const allPublished = updatedPlatforms.every(
          (p) => p.status === 'published'
        );
        const allFailed = updatedPlatforms.every((p) => p.status === 'failed');

        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: allPublished
              ? 'published'
              : allFailed
              ? 'failed'
              : 'partial',
            error: allFailed ? 'Failed to publish to all platforms' : null,
          },
        });
      } catch (error) {
        console.error(`Failed to publish scheduled post ${post.id}:`, error);
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: 'failed',
            error: error.message,
          },
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