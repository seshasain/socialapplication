import { TwitterApi } from 'twitter-api-v2';
import { PrismaClient } from '@prisma/client';
import { RateLimiter } from 'limiter';

const prisma = new PrismaClient();

// Store rate limiters per user
const userRateLimiters = new Map();

// Create rate limiter for a user (1500 requests per 15 minutes as per Twitter's user auth limits)
const createRateLimiter = (userId) => {
  const limiter = new RateLimiter({
    tokensPerInterval: 1500,
    interval: 900000,
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

export const postToTwitter = async (userId, client, postData) => {
  try {
    console.log('Attempting to post to Twitter for user:', userId);
    
    // Validate required parameters
    if (!userId || !client) {
      throw new Error('Missing required parameters: userId and client are required');
    }

    // Get rate limiter for this user
    const rateLimiter = getRateLimiter(userId);

    // Check if user has remaining tokens
    const remainingRequests = await rateLimiter.tryRemoveTokens(1);
    if (!remainingRequests) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const {
      caption = '',
      mediaFiles = [],
      threadContent = [],
      settings = {},
    } = postData;

    // Ensure we have either caption or threadContent
    if (!caption && (!threadContent || threadContent.length === 0)) {
      throw new Error('Either caption or thread content is required');
    }

    try {
      // Handle thread posts
      if (settings?.threadContent && settings.threadContent.length > 0) {
        console.log('Posting thread with', settings.threadContent.length, 'tweets');
        return await postThread(client, settings.threadContent);
      }

      // Handle single tweet
      console.log('Posting single tweet');
      return await postSingleTweet(client, caption, mediaFiles);
    } catch (error) {
      // Check if error is rate limit related
      if (error.code === 429) {
        // Return token if rate limited
        await rateLimiter.tryRemoveTokens(-1);
        throw new Error('Twitter rate limit exceeded. Please try again later.');
      }
      throw error;
    }
  } catch (error) {
    console.error('Twitter posting error:', error);
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
              size: file.size,
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
    total: 1500,
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