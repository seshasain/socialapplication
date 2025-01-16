import { TwitterApi } from 'twitter-api-v2';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export const createTwitterClient = (accessToken, accessSecret) => {
  // Add detailed logging
  console.log('Creating Twitter client with credentials:', {
    hasAppKey: !!process.env.TWITTER_API_KEY,
    hasAppSecret: !!process.env.TWITTER_API_SECRET,
    hasAccessToken: !!accessToken,
    hasAccessSecret: !!accessSecret
  });

  if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
    throw new Error('Twitter API credentials not configured');
  }

  if (!accessToken || !accessSecret) {
    throw new Error('Twitter access token and secret are required');
  }

  try {
    return new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: accessToken,
      accessSecret: accessSecret,
    });
  } catch (error) {
    console.error('Failed to create Twitter client:', error);
    throw error;
  }
};

export const postToTwitter = async (client, { caption, mediaFiles = [], threadContent = [], settings = {} }) => {
  try {
    console.log(threadContent,mediaFiles,settings);
    console.log("threadContent length,",threadContent?.length);
    console.log('Starting Twitter post with:', {
      hasThreadContent: !!threadContent?.length,
      mediaCount: mediaFiles?.length,
      hasSettings: !!Object.keys(settings).length
    });

    // Check if this is a thread post
    if (settings?.threadContent && settings.threadContent.length > 0) {
      console.log('Posting as thread with', settings.threadContent.length, 'tweets');
      return await postThread(client, settings.threadContent);
    }

    // Single tweet logic
    console.log('Posting as single tweet');
    return await postSingleTweet(client, caption, mediaFiles);
  } catch (error) {
    console.error('Twitter posting error:', error);
    throw error;
  }
};

async function postThread(client, threadContent) {
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
              // Fetch the media file using the fileId
              const response = await fetch(`${process.env.APP_URL}/api/media/${fileId}`);
              if (!response.ok) throw new Error(`Failed to fetch media file: ${response.statusText}`);
              
              const buffer = await response.arrayBuffer().then(arr => Buffer.from(arr));
              
              const mediaId = await client.v1.uploadMedia(buffer, {
                mimeType: response.headers.get('content-type'),
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

      // Post the tweet
      const tweetData = {
        text: tweet.text,
      };

      if (mediaIds.length > 0) {
        tweetData.media = { media_ids: mediaIds };
      }

      if (lastTweetId) {
        tweetData.reply = { in_reply_to_tweet_id: lastTweetId };
      }

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
}

async function postSingleTweet(client, text, mediaFiles) {
  try {
    console.log('Posting single tweet:', { text, mediaCount: mediaFiles.length });

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

            // Use node-fetch to get the buffer
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
    };

    if (mediaIds.length > 0) {
      tweetData.media = { media_ids: mediaIds };
    }

    console.log('Creating tweet with data:', {
      ...tweetData,
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
    console.error('Twitter posting error:', error);
    throw error;
  }
}