export const createPinterestClient = (accessToken) => {
    return {
      accessToken,
      baseUrl: 'https://api.pinterest.com/v5'
    };
  };
  
  export const postToPinterest = async (client, { caption, mediaFiles = [] }) => {
    try {
      if (mediaFiles.length === 0) {
        throw new Error('Pinterest requires at least one media file');
      }
  
      const mediaFile = mediaFiles[0];
  
      // Step 1: Create Pin
      const response = await fetch(`${client.baseUrl}/pins`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${client.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: caption.slice(0, 100),
          description: caption,
          media_source: {
            source_type: 'image_url',
            url: mediaFile.url
          },
          board_id: 'your-board-id' // This should come from settings or parameters
        })
      });
  
      if (!response.ok) {
        throw new Error(`Pinterest API error: ${response.statusText}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Pinterest posting error:', error);
      throw error;
    }
  };