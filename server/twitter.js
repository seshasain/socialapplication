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
            const arrayBuffer = await mediaResponse.arrayBuffer();
            const mediaBuffer = Buffer.from(arrayBuffer);

            // Determine media type and validate
            const mimeType = file.type.toLowerCase();
            let mediaType;
            
            if (mimeType.startsWith('image/')) {
              if (mimeType === 'image/gif') {
                mediaType = 'gif';
              } else {
                mediaType = 'image/jpeg';
              }
            } else if (mimeType.startsWith('video/')) {
              mediaType = 'video/mp4';
            } else {
              throw new Error(`Unsupported media type: ${mimeType}`);
            }

            // Upload media to Twitter
            const mediaId = await client.v1.uploadMedia(mediaBuffer, {
              mimeType: mediaType
            });

            // Wait for media processing to complete
            if (mediaType === 'video/mp4' || mediaType === 'gif') {
              await client.v1.waitForMediaProcessing(mediaId);
            }

            return mediaId;
          } catch (error) {
            console.error(`Failed to upload media file ${file.filename}:`, error);
            throw error;
          }
        })
      );
    }

    // Create tweet
    const tweet = await client.v2.tweet({
      text: caption,
      ...(mediaIds.length > 0 && {
        media: {
          media_ids: mediaIds
        }
      })
    });

    return tweet;
  } catch (error) {
    console.error('Twitter posting error:', error);
    throw error;
  }
};