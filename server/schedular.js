import schedule from 'node-schedule';
import { PrismaClient } from '@prisma/client';

import { createTwitterClient, postToTwitter } from './twitter.js';

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
        await publishPost(post);
      } catch (error) {
        console.error(`Failed to publish scheduled post ${post.id}:`, error);
        await updatePostStatus(post.id, 'failed', error);
      }
    });

    scheduledJobs.set(post.id, job);
    console.log("Job Scheduled");
    return job;
  } catch (error) {
    console.error('Error scheduling post:', error.data?.detail);
    throw error.data?.detail;
  }
};

export const cancelScheduledPost = (postId) => {
  if (scheduledJobs.has(postId)) {
    scheduledJobs.get(postId).cancel();
    scheduledJobs.delete(postId);
  }
};

const publishPost = async (post) => {

  console.log("publishing post", post)
  try {
    await updatePostStatus(post.id, 'publishing');

    // Publish the post directly
    const socialAccount = post.user.socialAccounts.find(
      account => account.platform === 'twitter'
    );

    if (!socialAccount) {
      throw new Error(`No connected  account found`);
    }

    const twitterClient = createTwitterClient(
      socialAccount.accessToken,
      socialAccount.refreshToken
    );
    // Attempt to post to Twitter
    try {
      await postToTwitter(twitterClient, {
        caption: `${post.caption} ${post.hashtags}`.trim(),
        mediaFiles: post.mediaFiles
      });
      // Mark the post as published if successful
      await updatePostStatus(post.id, 'published');
    } catch (error) {
      // Update status to failed if posting to Twitter fails
      await updatePostStatus(post.id, 'failed',error);
      console.error('Post creation error:', error.message);
    }
  } catch (error) {
    console.error('Post creation error:', error);
  }
};



const updatePostStatus = async (postId, status, error = null) => {
  let errorMessage;
  try {
    const trimmedErrorMessage = typeof error === 'object' ? JSON.stringify(error) : error;
    errorMessage = errorMessage.length > 100 ? trimmedErrorMessage.slice(0, 99) : trimmedErrorMessage;
  }
  catch(error)
  {
    errorMessage = typeof error === 'object' ? JSON.stringify(error).slice(0, 99) : error;
  }
    await prisma.post.update({
      where: { id: postId },
      data: {
        status,
        error: errorMessage
      }
    });
};


