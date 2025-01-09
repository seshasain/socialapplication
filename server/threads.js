export const createThreadsClient = (accessToken) => {
    return {
      accessToken,
      baseUrl: 'https://www.threads.net/api/v1'
    };
  };
  
  export const postToThreads = async (client, { caption, mediaFiles = [], replyToId = null }) => {
    try {
      const formData = new FormData();
      formData.append('caption', caption);
      
      if (mediaFiles.length > 0) {
        mediaFiles.forEach((file, index) => {
          formData.append(`media_${index}`, file.buffer, file.filename);
        });
      }
  
      if (replyToId) {
        formData.append('reply_to', replyToId);
      }
  
      const response = await fetch(`${client.baseUrl}/media/configure_text_only/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${client.accessToken}`
        },
        body: formData
      });
  
      if (!response.ok) {
        throw new Error(`Threads API error: ${response.statusText}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Threads posting error:', error);
      throw error;
    }
  };