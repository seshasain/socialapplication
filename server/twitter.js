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
          const mediaBuffer = await fetch(file.url).then(res => res.buffer());
          return client.v1.uploadMedia(mediaBuffer, {
            mimeType: file.type === 'image' ? 'image/jpeg' : 'video/mp4'
          });
        })
      );
    }

    // Create tweet
    const tweet = await client.v2.tweet({
      text: caption,
      media: mediaIds.length > 0 ? { media_ids: mediaIds } : undefined
    });

    return tweet;
  } catch (error) {
    console.error('Twitter posting error:', error);
    throw error;
  }
};