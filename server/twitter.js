import { TwitterApi } from 'twitter-api-v2';

export const createTwitterClient = (accessToken, accessSecret) => {
  if (!accessToken || !accessSecret) {
    console.error('Twitter credentials missing:', { hasToken: !!accessToken, hasSecret: !!accessSecret });
    throw new Error('User Twitter credentials not provided');
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

            const mediaBuffer = await fetch(file.url).then(res => res.buffer());
            const mediaId = await client.v1.uploadMedia(mediaBuffer, {
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