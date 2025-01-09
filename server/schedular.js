import schedule from 'node-schedule';
import { PrismaClient } from '@prisma/client';
import { createTwitterClient, postToTwitter } from './twitter.js';
import { createFacebookClient, postToFacebook } from './facebook.js';
import { createInstagramClient, postToInstagram } from './instagram.js';
import { createLinkedInClient, postToLinkedIn } from './linkedin.js';
import { createYouTubeClient, postToYouTube } from './youtube.js';
import { createTikTokClient, postToTikTok } from './tiktok.js';
import { createPinterestClient, postToPinterest } from './pinterest.js';
import { createThreadsClient, postToThreads } from './threads.js';
import { RateLimiter } from 'limiter';
import { uploadToB2, getFileFromB2 } from './storage/b2.js';

const prisma = new PrismaClient();
const scheduledJobs = new Map();
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

// Rate limiters for different platforms
const rateLimiters = {
  twitter: new RateLimiter({ tokensPerInterval: 300, interval: 'hour' }),
  facebook: new RateLimiter({ tokensPerInterval: 200, interval: 'hour' }),
  instagram: new RateLimiter({ tokensPerInterval: 200, interval: 'hour' }),
  linkedin: new RateLimiter({ tokensPerInterval: 100, interval: 'hour' }),
  youtube: new RateLimiter({ tokensPerInterval: 50, interval: 'hour' }),
  tiktok: new RateLimiter({ tokensPerInterval: 100, interval: 'hour' }),
  pinterest: new RateLimiter({ tokensPerInterval: 100, interval: 'hour' }),
  threads: new RateLimiter({ tokensPerInterval: 150, interval: 'hour' })
};

// Platform-specific post type handlers
const postTypeHandlers = {
  twitter: {
    post: postToTwitter,
    thread: async (client, content) => {
      const tweets = [];
      for (const tweet of content.threadContent) {
        const response = await postToTwitter(client, {
          ...content,
          caption: tweet,
          replyToId: tweets[tweets.length - 1]?.id
        });
        tweets.push(response);
      }
      return tweets;
    }
  },
  facebook: {
    post: postToFacebook,
    story: async (client, content) => {
      return postToFacebook(client, { ...content, isStory: true });
    },
    reel: async (client, content) => {
      return postToFacebook(client, { ...content, isReel: true });
    }
  },
  instagram: {
    post: postToInstagram,
    story: async (client, content) => {
      return postToInstagram(client, { ...content, isStory: true });
    },
    reel: async (client, content) => {
      return postToInstagram(client, { ...content, isReel: true });
    }
  },
  linkedin: {
    post: postToLinkedIn,
    article: async (client, content) => {
      return postToLinkedIn(client, { ...content, isArticle: true });
    }
  },
  youtube: {
    video: postToYouTube,
    shorts: async (client, content) => {
      return postToYouTube(client, { ...content, isShort: true });
    }
  },
  tiktok: {
    video: postToTikTok
  },
  pinterest: {
    pin: postToPinterest,
    story: async (client, content) => {
      return postToPinterest(client, { ...content, isStory: true });
    }
  },
  threads: {
    post: postToThreads,
    thread: async (client, content) => {
      const posts = [];
      for (const thread of content.threadContent) {
        const response = await postToThreads(client, {
          ...content,
          caption: thread,
          replyToId: posts[posts.length - 1]?.id
        });
        posts.push(response);
      }
      return posts;
    }
  }
};

// Media pre-processing function
async function preprocessMedia(mediaFiles) {
  const processedMedia = [];
  
  for (const file of mediaFiles) {
    try {
      // Get pre-signed URL for the media file
      const mediaBuffer = await getFileFromB2(file.s3Key);
      
      const processedFile = {
        ...file,
        buffer: mediaBuffer
      };
      
      processedMedia.push(processedFile);
    } catch (error) {
      console.error(`Failed to process media file ${file.id}:`, error);
      throw error;
    }
  }
  
  return processedMedia;
}

// Get platform client with retry logic
async function getPlatformClient(platform, socialAccount, retryCount = 0) {
  try {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return createTwitterClient(socialAccount.accessToken, socialAccount.accessSecret);
      case 'facebook':
        return createFacebookClient(socialAccount.accessToken);
      case 'instagram':
        return createInstagramClient(socialAccount.accessToken);
      case 'linkedin':
        return createLinkedInClient(socialAccount.accessToken);
      case 'youtube':
        return createYouTubeClient(socialAccount.accessToken);
      case 'tiktok':
        return createTikTokClient(socialAccount.accessToken);
      case 'pinterest':
        return createPinterestClient(socialAccount.accessToken);
      case 'threads':
        return createThreadsClient(socialAccount.accessToken);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying client creation for ${platform}. Attempt ${retryCount + 1}/${MAX_RETRIES}`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return getPlatformClient(platform, socialAccount, retryCount + 1);
    }
    throw error;
  }
}

export const schedulePost = async (post) => {
  console.log('Scheduling post:', post.id);
  
  try {
    // Cancel existing job if it exists
    if (scheduledJobs.has(post.id)) {
      console.log('Cancelling existing job for post:', post.id);
      scheduledJobs.get(post.id).cancel();
    }

    // Schedule new job
    const job = schedule.scheduleJob(new Date(post.scheduledDate), async () => {
      console.log('Executing scheduled post:', post.id);
      
      try {
        // Pre-process media files before posting
        const processedMedia = await preprocessMedia(post.mediaFiles);

        // Process each platform in parallel
        const platformPromises = post.platforms.map(async (platformData) => {
          const { platform, postType = 'post' } = platformData;
          
          try {
            // Check rate limit
            await rateLimiters[platform].removeTokens(1);
            
            // Get social account
            const socialAccount = await prisma.socialAccount.findFirst({
              where: {
                userId: post.userId,
                platform: platformData.platform
              }
            });

            if (!socialAccount) {
              throw new Error(`No connected ${platform} account found`);
            }

            // Get platform client
            const client = await getPlatformClient(platform, socialAccount);

            // Get post type handler
            const handler = postTypeHandlers[platform]?.[postType];
            if (!handler) {
              throw new Error(`Unsupported post type "${postType}" for ${platform}`);
            }

            // Prepare post content
            const postContent = {
              caption: post.caption,
              mediaFiles: processedMedia,
              hashtags: post.hashtags,
              settings: platformData.settings || {},
              threadContent: post.threadContent // For thread-type posts
            };

            // Execute platform-specific post handler
            const result = await handler(client, postContent);

            // Update post platform status
            await prisma.postPlatform.update({
              where: { id: platformData.id },
              data: {
                status: 'published',
                publishedAt: new Date(),
                externalId: result.id || result.postId,
              },
            });

            return { platform, success: true };
          } catch (error) {
            console.error(`Failed to publish to ${platform}:`, error);
            
            // Update platform status with error
            await prisma.postPlatform.update({
              where: { id: platformData.id },
              data: {
                status: 'failed',
                error: error.message,
              },
            });

            return { platform, success: false, error: error.message };
          }
        });

        // Wait for all platforms to complete
        const results = await Promise.all(platformPromises);

        // Update main post status
        const allSuccess = results.every(r => r.success);
        const allFailed = results.every(r => !r.success);

        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: allSuccess ? 'published' : allFailed ? 'failed' : 'partial',
            error: allFailed ? 'Failed to publish to all platforms' : null,
          },
        });

        // Cleanup processed media
        processedMedia.forEach(media => {
          if (media.buffer) {
            media.buffer = null;
          }
        });

      } catch (error) {
        console.error(`Failed to process scheduled post ${post.id}:`, error);
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