import { TwitterApi } from 'twitter-api-v2';
import { RateLimiter } from 'limiter';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Store rate limiters in memory, keyed by user ID
const userRateLimiters = new Map();

// Create rate limiter for a user (17 requests per 24 hours)
const createRateLimiter = (userId) => {
  const limiter = new RateLimiter({
    tokensPerInterval: 17,
    interval: "day",
    fireImmediately: true
  });
  userRateLimiters.set(userId, limiter);
  return limiter;
};

// Get or create rate limiter for a user
const getRateLimiter = (userId) => {
  if (!userRateLimiters.has(userId)) {
    return createRateLimiter(userId);
  }
  return userRateLimiters.get(userId);
};

export const createTwitterClient = async (accessToken, accessSecret) => {
  if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
    throw new Error('Twitter API credentials not configured');
  }

  return new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: accessToken,
    accessSecret: accessSecret,
  });
};

export const postToTwitter = async (userId, client, { caption, mediaFiles = [], threadContent = [], settings = {} }) => {
  try {
    console.log('Attempting to post to Twitter for user:', userId);
    
    // Get rate limiter for this user
    const rateLimiter = getRateLimiter(userId);
    
    // Check if user has remaining tokens
    const remainingRequests = await rateLimiter.tryRemoveTokens(1);
    if (!remainingRequests) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Handle thread posts
    if (settings?.threadContent && settings.threadContent.length > 0) {
      console.log('Posting thread with', settings.threadContent.length, 'tweets');
      return await postThread(client, settings.threadContent);
    }

    // Handle single tweet
    console.log('Posting single tweet');
    return await postSingleTweet(client, caption, mediaFiles);
  } catch (error) {
    console.error('Twitter posting error:', error);
    
    // If the error is due to Twitter API issues, don't consume the rate limit token
    if (error.code && (error.code === 429 || error.code >= 500)) {
      const rateLimiter = getRateLimiter(userId);
      await rateLimiter.tryRemoveTokens(-1); // Return the token
    }
    
    throw error;
  }
};

const postSingleTweet = async (client, text, mediaFiles = []) => {
  try {
    console.log('Processing single tweet with', mediaFiles.length, 'media files');
    
    let mediaIds = [];
    if (mediaFiles.length > 0) {
      mediaIds = await Promise.all(
        mediaFiles.map(async (file) => {
          try {
            console.log('Uploading media file:', {
              filename: file.filename,
              type: file.type,
              size: file.size
            });

            const response = await fetch(file.url);
            if (!response.ok) throw new Error(`Failed to fetch media file: ${response.statusText}`);

            const buffer = await response.arrayBuffer().then(arr => Buffer.from(arr));
            const mediaId = await client.v1.uploadMedia(buffer, {
              mimeType: file.type,
            });

            console.log('Successfully uploaded media:', { mediaId });
            return mediaId;
          } catch (error) {
            console.error(`Failed to upload media file ${file.filename}:`, error);
            throw error;
          }
        })
      );
    }

    // Create tweet
    const tweetData = {
      text: text,
      media: mediaIds.length > 0 ? { media_ids: mediaIds } : undefined
    };

    console.log('Creating tweet with data:', {
      textLength: text.length,
      mediaCount: mediaIds.length
    });

    const tweet = await client.v2.tweet(tweetData);
    console.log('Successfully posted tweet:', tweet);

    return {
      id: tweet.data.id,
      text: tweet.data.text,
      externalId: tweet.data.id
    };
  } catch (error) {
    console.error('Error in postSingleTweet:', error);
    throw error;
  }
};

const postThread = async (client, threadContent) => {
  let lastTweetId = null;
  const tweets = [];

  try {
    for (const tweet of threadContent) {
      console.log('Processing thread tweet:', {
        text: tweet.text,
        mediaCount: tweet.mediaFiles?.length,
        replyToId: lastTweetId
      });

      // Upload media for this tweet if any
      let mediaIds = [];
      if (tweet.mediaFiles && tweet.mediaFiles.length > 0) {
        mediaIds = await Promise.all(
          tweet.mediaFiles.map(async (fileId) => {
            try {
              // Find the media file from the provided mediaFiles array
              const mediaFile = mediaFiles.find(file => file.id === fileId);
              if (!mediaFile) throw new Error(`Media file not found: ${fileId}`);

              console.log('Uploading media file:', {
                filename: mediaFile.filename,
                type: mediaFile.type,
                size: mediaFile.size
              });

              const response = await fetch(mediaFile.url);
              if (!response.ok) throw new Error(`Failed to fetch media file: ${response.statusText}`);

              const buffer = await response.arrayBuffer().then(arr => Buffer.from(arr));
              const mediaId = await client.v1.uploadMedia(buffer, {
                mimeType: mediaFile.type,
              });

              console.log('Successfully uploaded media:', { mediaId });
              return mediaId;
            } catch (error) {
              console.error(`Failed to upload media file ${fileId}:`, error);
              throw error;
            }
          })
        );
      }

      // Create tweet data
      const tweetData = {
        text: tweet.text,
      };

      if (mediaIds.length > 0) {
        tweetData.media = { media_ids: mediaIds };
      }

      if (lastTweetId) {
        tweetData.reply = { in_reply_to_tweet_id: lastTweetId };
      }

      // Post the tweet
      const postedTweet = await client.v2.tweet(tweetData);
      console.log('Posted tweet:', postedTweet);

      lastTweetId = postedTweet.data.id;
      tweets.push(postedTweet);
    }

    return {
      id: tweets[0].data.id,
      thread: tweets.map(t => t.data.id)
    };
  } catch (error) {
    console.error('Failed to post thread:', error);
    throw error;
  }
};

// Utility function to check remaining rate limit for a user
export const getRemainingRateLimit = async (userId) => {
  const rateLimiter = getRateLimiter(userId);
  const remainingTokens = await rateLimiter.getTokensRemaining();
  return {
    remaining: remainingTokens,
    total: 17,
    resetTime: new Date(Date.now() + rateLimiter.msToNextReset())
  };
};

// Clean up rate limiters for inactive users
setInterval(() => {
  const now = Date.now();
  for (const [userId, limiter] of userRateLimiters.entries()) {
    if (now - limiter.lastActive > 24 * 60 * 60 * 1000) { // 24 hours
      userRateLimiters.delete(userId);
    }
  }
}, 60 * 60 * 1000); // Check every hour