import { FacebookApi } from 'facebook-api-node';

export const createFacebookClient = (accessToken) => {
  return new FacebookApi({
    appId: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET,
    accessToken: accessToken,
  });
};

export const postToFacebook = async (client, { caption, mediaFiles = [] }) => {
  try {
    let mediaIds = [];

    // Upload media files if present
    if (mediaFiles.length > 0) {
      mediaIds = await Promise.all(
        mediaFiles.map(async (file) => {
          const mediaBuffer = await fetch(file.url).then(res => res.buffer());
          const uploadResponse = await client.uploadMedia({
            media: mediaBuffer,
            mediaType: file.type === 'image' ? 'IMAGE' : 'VIDEO'
          });
          return uploadResponse.id;
        })
      );
    }

    // Create post
    const post = await client.createPost({
      message: caption,
      mediaIds: mediaIds.length > 0 ? mediaIds : undefined
    });

    return post;
  } catch (error) {
    console.error('Facebook posting error:', error);
    throw error;
  }
};