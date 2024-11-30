import fb from 'fb';

export const createFacebookClient = (accessToken) => {
  fb.options({
    appId: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET,
    version: 'v18.0'
  });
  
  fb.setAccessToken(accessToken);
  return fb;
};

export const postToFacebook = async (client, { caption, mediaFiles = [] }) => {
  try {
    let mediaIds = [];

    // Upload media files if present
    if (mediaFiles.length > 0) {
      mediaIds = await Promise.all(
        mediaFiles.map(async (file) => {
          const mediaBuffer = await fetch(file.url).then(res => res.buffer());
          const uploadResponse = await new Promise((resolve, reject) => {
            client.api('/me/photos', 'POST', {
              source: mediaBuffer,
              published: false
            }, (res) => {
              if(!res || res.error) {
                reject(res ? res.error : 'Unknown error');
                return;
              }
              resolve(res);
            });
          });
          return uploadResponse.id;
        })
      );
    }

    // Create post
    const postData = {
      message: caption
    };

    if (mediaIds.length > 0) {
      postData.attached_media = mediaIds.map(id => ({ media_fbid: id }));
    }

    const post = await new Promise((resolve, reject) => {
      client.api('/me/feed', 'POST', postData, (res) => {
        if(!res || res.error) {
          reject(res ? res.error : 'Unknown error');
          return;
        }
        resolve(res);
      });
    });

    return post;
  } catch (error) {
    console.error('Facebook posting error:', error);
    throw error;
  }
};