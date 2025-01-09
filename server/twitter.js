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

            // Determine media type
            let mediaType;
            switch (file.type) {
              case 'image/jpeg':
              case 'image/png':
                mediaType = 'image/jpeg';
                break;
              case 'image/gif':
                mediaType = 'image/gif';
                break;
              case 'video/mp4':
                mediaType = 'video/mp4';
                break;
              default:
                throw new Error(`Unsupported media type: ${file.type}`);
            }

            // Upload media to Twitter
            const mediaId = await client.v1.uploadMedia(mediaBuffer, {
              mimeType: mediaType,
              target: file.type.startsWith('video/') ? 'tweet_video' : 'tweet_image'
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
