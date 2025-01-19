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
    console.log('Post data:', JSON.stringify(postData, null, 2));
    
    // Check if this is a thread post
    const isThread = postData.threadContent && postData.threadContent.length > 0;
    console.log('Is thread post:', isThread);
    
    if (isThread) {
      console.log('Posting thread with', postData.threadContent.length, 'tweets');
      return await postThread(client, postData.threadContent);
    } else {
      console.log('Posting single tweet');
      return await postSingleTweet(client, postData.caption, postData.mediaFiles);
    }
  } catch (error) {
    console.error('Twitter posting error:', error);
    throw error;
  }
};

const postSingleTweet = async (client, text, mediaFiles = []) => {
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

  // Create tweet data
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
};


const postThread = async (client, threadContent) => {
  let lastTweetId = null;
  const tweets = [];

  console.log('Processing thread with content:', JSON.stringify(threadContent, null, 2));

  for (const tweet of threadContent) {
    try {
      console.log('Processing thread tweet:', {
        text: tweet,
        mediaFiles: tweet.mediaFiles,
        replyToId: lastTweetId
      });

      // Upload media files if present
      let mediaIds = [];
      if (tweet.mediaFiles && tweet.mediaFiles.length > 0) {
        mediaIds = await Promise.all(
          tweet.mediaFiles.map(async (fileId) => {
            try {
              // Fetch the media file from your storage
              const mediaFile = await prisma.mediaFile.findUnique({
                where: { id: fileId }
              });

              if (!mediaFile) {
                throw new Error(`Media file not found: ${fileId}`);
              }

              // Download the file from the URL
              const response = await fetch(mediaFile.url);
              if (!response.ok) throw new Error(`Failed to fetch media file: ${response.statusText}`);

              const buffer = await response.arrayBuffer().then(arr => Buffer.from(arr));

              // Upload to Twitter
              const mediaId = await client.v1.uploadMedia(buffer, {
                mimeType: mediaFile.type,
              });

              console.log('Successfully uploaded media:', { mediaId, fileId });
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
        text: tweet,
        ...(lastTweetId && { reply: { in_reply_to_tweet_id: lastTweetId } }),
        ...(mediaIds.length > 0 && { media: { media_ids: mediaIds } })
      };

      console.log('Creating thread tweet with data:', {
        textLength: tweet.length,
        mediaCount: mediaIds.length,
        replyToId: lastTweetId
      });

      const postedTweet = await client.v2.tweet(tweetData);
      console.log('Successfully posted thread tweet:', postedTweet);

      lastTweetId = postedTweet.data.id;
      tweets.push(postedTweet);
    } catch (error) {
      console.error('Failed to post thread tweet:', error);
      throw error;
    }
  }

  return {
    id: tweets[0].data.id,
    thread: tweets.map((t) => t.data.id),
  };
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