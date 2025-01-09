import { TwitterApi } from 'twitter-api-v2';

export const createTwitterClient = (accessToken, accessSecret) => {
  return new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: accessToken,
    accessSecret: accessSecret,
  });
};

export const postToTwitter = async (client, { caption, mediaFiles = [] }) => {
  try {
    let mediaIds = [];

    // Upload media files if present
    if (mediaFiles.length > 0) {
      mediaIds = await Promise.all(
        mediaFiles.map(async (file) => {
          try {
            // Fetch the media file
            const mediaResponse = await fetch(file.url);
            if (!mediaResponse.ok) {
              throw new Error(`Failed to fetch media file: ${mediaResponse.statusText}`);
            }
            const mediaBuffer = await mediaResponse.buffer();

            // Determine media type and validate
            let mediaType;
            const mimeType = file.type.toLowerCase();
            
            if (mimeType.startsWith('image/')) {
              if (mimeType === 'image/gif') {
                mediaType = 'gif';
              } else {
                mediaType = 'image/jpeg'; // Twitter prefers JPEG
              }
            } else if (mimeType.startsWith('video/')) {
              mediaType = 'video/mp4'; // Twitter accepts MP4
            } else {
              throw new Error(`Unsupported media type: ${mimeType}`);
            }

            // Upload media to Twitter with proper type
            const mediaId = await client.v1.uploadMedia(mediaBuffer, {
              mimeType: mediaType,
              target: mediaType === 'video/mp4' ? 'tweet_video' : 'tweet_image'
            });

            return mediaId;
          } catch (error) {
            console.error(`Failed to upload media file ${file.filename}:`, error);
            throw error;
          }
        })
      );
    }

    // Create tweet with media
    const tweetOptions = {
      text: caption,
      ...(mediaIds.length > 0 && { media: { media_ids: mediaIds } })
    };

    const tweet = await client.v2.tweet(tweetOptions);
    return tweet;

  } catch (error) {
    console.error('Twitter posting error:', error);
    throw error;
  }
};