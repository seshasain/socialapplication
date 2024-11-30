import fb from 'fb';

export const createInstagramClient = (accessToken) => {
  fb.options({
    appId: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET,
    version: 'v18.0'
  });
  
  fb.setAccessToken(accessToken);
  return fb;
};

export const authenticateInstagram = async (client, instagramAccountId) => {
  try {
    const response = await new Promise((resolve, reject) => {
      client.api(`/${instagramAccountId}`, 'GET', (res) => {
        if (!res || res.error) {
          reject(res ? res.error : 'Failed to authenticate Instagram account');
          return;
        }
        resolve(res);
      });
    });
    return response;
  } catch (error) {
    console.error('Instagram authentication error:', error);
    throw error;
  }
};

export const postToInstagram = async (client, { caption, mediaFiles = [] }) => {
  try {
    if (mediaFiles.length === 0) {
      throw new Error('Instagram requires at least one media file');
    }

    // Get Instagram Business Account ID
    const instagramAccount = await new Promise((resolve, reject) => {
      client.api('/me/accounts', 'GET', { fields: 'instagram_business_account' }, (res) => {
        if (!res || res.error) {
          reject(res ? res.error : 'Failed to get Instagram business account');
          return;
        }
        resolve(res.data[0].instagram_business_account.id);
      });
    });

    // Handle different post types based on media
    if (mediaFiles.length === 1) {
      // Single media post
      const mediaType = mediaFiles[0].type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
      
      // Create container
      const container = await new Promise((resolve, reject) => {
        client.api(`/${instagramAccount}/media`, 'POST', {
          image_url: mediaFiles[0].url,
          caption: caption,
          media_type: mediaType
        }, (res) => {
          if (!res || res.error) {
            reject(res ? res.error : 'Failed to create media container');
            return;
          }
          resolve(res.id);
        });
      });

      // Publish the post
      return await new Promise((resolve, reject) => {
        client.api(`/${instagramAccount}/media_publish`, 'POST', {
          creation_id: container
        }, (res) => {
          if (!res || res.error) {
            reject(res ? res.error : 'Failed to publish post');
            return;
          }
          resolve(res);
        });
      });
    } else {
      // Carousel post
      const mediaIds = await Promise.all(mediaFiles.map(async (file) => {
        return new Promise((resolve, reject) => {
          client.api(`/${instagramAccount}/media`, 'POST', {
            image_url: file.url,
            media_type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
            is_carousel_item: true
          }, (res) => {
            if (!res || res.error) {
              reject(res ? res.error : 'Failed to create carousel item');
              return;
            }
            resolve(res.id);
          });
        });
      }));

      // Create carousel container
      const container = await new Promise((resolve, reject) => {
        client.api(`/${instagramAccount}/media`, 'POST', {
          media_type: 'CAROUSEL',
          caption: caption,
          children: mediaIds
        }, (res) => {
          if (!res || res.error) {
            reject(res ? res.error : 'Failed to create carousel container');
            return;
          }
          resolve(res.id);
        });
      });

      // Publish the carousel
      return await new Promise((resolve, reject) => {
        client.api(`/${instagramAccount}/media_publish`, 'POST', {
          creation_id: container
        }, (res) => {
          if (!res || res.error) {
            reject(res ? res.error : 'Failed to publish carousel');
            return;
          }
          resolve(res);
        });
      });
    }
  } catch (error) {
    console.error('Instagram posting error:', error);
    throw error;
  }
};