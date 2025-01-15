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

            // Generate a unique filename for storage
            const fileExt = path.extname(file.filename);
            const uniqueFilename = `${uuidv4()}${fileExt}`;

            // Use node-fetch to get the buffer
            const response = await fetch(file.url);
            if (!response.ok) throw new Error(`Failed to fetch media file: ${response.statusText}`);
            
            const buffer = await response.arrayBuffer().then(arr => Buffer.from(arr));

            // Determine the correct media type
            let mediaType;
            if (file.type.startsWith('image/')) {
              if (file.type === 'image/gif') {
                mediaType = 'gif';
              } else {
                mediaType = 'image/jpeg'; // Twitter prefers JPEG
              }
            } else if (file.type.startsWith('video/')) {
              mediaType = 'video/mp4'; // Twitter prefers MP4
            } else {
              throw new Error(`Unsupported media type: ${file.type}`);
            }

            // Initialize media upload
            const mediaId = await client.v1.uploadMedia(buffer, {
              mimeType: mediaType,
              filename: uniqueFilename,
              target: mediaType === 'gif' ? 'tweet_gif' : undefined
            });

            console.log('Successfully uploaded media to Twitter:', { mediaId });
            return mediaId;
          } catch (error) {
            console.error(`Failed to upload media file ${file.filename}:`, error);
            throw new Error(`Media upload failed: ${error.message}`);
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

    // Extract and return the tweet ID and other relevant data
    return {
      id: tweet.data.id,
      text: tweet.data.text,
      externalId: tweet.data.id // Ensure we return the external ID
    };
  } catch (error) {
    console.error('Twitter posting error:', error);
    throw error;
  }
};