import { TwitterApi } from 'twitter-api-v2';

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


export const postToTwitter = async (client, { caption, mediaFiles = [] }) => {
  try {
    console.log('Starting Twitter post with:', {
      captionLength: caption.length,
      mediaCount: mediaFiles.length
    });

    let mediaIds = [];

    // Upload media files if present
    if (mediaFiles.length > 0) {
      mediaIds = await Promise.all(
        mediaFiles.map(async (file) => {
          try {
            console.log('Uploading media file to Twitter:', {
              filename: file.filename,
              type: file.type,
              size: file.size
            });

            // Use node-fetch to get the buffer
            const response = await fetch(file.url);
            if (!response.ok) throw new Error(`Failed to fetch media file: ${response.statusText}`);
            
            const buffer = await response.arrayBuffer().then(arr => Buffer.from(arr));
            
            const mediaId = await client.v1.uploadMedia(buffer, {
              mimeType: file.type
            });

            console.log('Successfully uploaded media to Twitter:', { mediaId });
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
      text: caption,
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

    return tweet;
  } catch (error) {
    console.error('Twitter posting error:', error);
    throw error;
  }
};
