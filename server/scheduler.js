import schedule from 'node-schedule';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Store scheduled jobs in memory
const scheduledJobs = new Map();

export const schedulePost = async (post) => {
  try {
    // Cancel existing job if it exists
    if (scheduledJobs.has(post.id)) {
      scheduledJobs.get(post.id).cancel();
    }

    // Schedule new job
    const job = schedule.scheduleJob(new Date(post.scheduledDate), async () => {
      try {
        await publishPost(post.id);
      } catch (error) {
        console.error(`Failed to publish scheduled post ${post.id}:`, error);
        await updatePostStatus(post.id, 'failed', error.message);
      }
    });

    scheduledJobs.set(post.id, job);
    return job;
  } catch (error) {
    console.error('Error scheduling post:', error);
    throw error;
  }
};

export const cancelScheduledPost = (postId) => {
  if (scheduledJobs.has(postId)) {
    scheduledJobs.get(postId).cancel();
    scheduledJobs.delete(postId);
  }
};

const publishPost = async (postId) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        mediaFiles: true,
        user: {
          include: {
            socialAccounts: true
          }
        }
      }
    });

    if (!post) {
      throw new Error('Post not found');
    }

    // Update status to publishing
    await updatePostStatus(postId, 'publishing');

    // Get social media account credentials
    const socialAccount = post.user.socialAccounts.find(
      account => account.platform === post.platform
    );

    if (!socialAccount) {
      throw new Error(`No connected ${post.platform} account found`);
    }

    // Implement platform-specific publishing logic here
    // For demo, we'll just simulate successful publishing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update post status to published
    await updatePostStatus(postId, 'published');

    return post;
  } catch (error) {
    console.error('Error publishing post:', error);
    throw error;
  }
};

const updatePostStatus = async (postId, status, error = null) => {
  try {
    await prisma.post.update({
      where: { id: postId },
      data: { 
        status,
        error: error
      }
    });
  } catch (err) {
    console.error('Error updating post status:', err);
    throw err;
  }
};