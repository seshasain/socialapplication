export const createTikTokClient = (accessToken) => {
    return {
      accessToken,
      baseUrl: 'https://open.tiktokapis.com/v2'
    };
  };
  
  export const postToTikTok = async (client, { caption, mediaFiles = [] }) => {
    try {
      if (mediaFiles.length === 0 || !mediaFiles[0].type.startsWith('video/')) {
        throw new Error('TikTok requires a video file');
      }
  
      const videoFile = mediaFiles[0];
  
      // Step 1: Initialize upload
      const initResponse = await fetch(`${client.baseUrl}/video/upload/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${client.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
  
      const { upload_url } = await initResponse.json();
  
      // Step 2: Upload video
      await fetch(upload_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'video/mp4'
        },
        body: videoFile.buffer
      });
  
      // Step 3: Create post
      const publishResponse = await fetch(`${client.baseUrl}/video/publish/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${client.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          caption,
          visibility: 'PUBLIC'
        })
      });
  
      return await publishResponse.json();
    } catch (error) {
      console.error('TikTok posting error:', error);
      throw error;
    }
  };