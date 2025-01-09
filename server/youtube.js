import { google } from 'googleapis';

export const createYouTubeClient = (accessToken) => {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  return google.youtube({
    version: 'v3',
    auth: oauth2Client
  });
};

export const postToYouTube = async (client, { caption, mediaFiles = [] }) => {
  try {
    if (mediaFiles.length === 0 || !mediaFiles[0].type.startsWith('video/')) {
      throw new Error('YouTube requires a video file');
    }

    const videoFile = mediaFiles[0];
    
    const response = await client.videos.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: caption.slice(0, 100), // YouTube title limit
          description: caption,
          tags: caption.match(/#\w+/g) || []
        },
        status: {
          privacyStatus: 'public'
        }
      },
      media: {
        body: videoFile.buffer
      }
    });

    return response.data;
  } catch (error) {
    console.error('YouTube posting error:', error);
    throw error;
  }
};