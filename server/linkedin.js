import { Client } from 'linkedin-api-client';

export const createLinkedInClient = (accessToken) => {
  return new Client({
    accessToken,
    apiVersion: 'v2'
  });
};

export const postToLinkedIn = async (client, { caption, mediaFiles = [] }) => {
  try {
    let mediaIds = [];

    // Upload media files if present
    if (mediaFiles.length > 0) {
      mediaIds = await Promise.all(
        mediaFiles.map(async (file) => {
          const mediaBuffer = await fetch(file.url).then(res => res.buffer());
          const uploadResponse = await client.upload.registerUpload({
            mediaType: file.type === 'image' ? 'IMAGE' : 'VIDEO',
            media: mediaBuffer
          });
          return uploadResponse.value.asset;
        })
      );
    }

    // Create post
    const post = await client.posts.create({
      author: `urn:li:person:${process.env.LINKEDIN_PERSON_ID}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: caption
          },
          media: mediaIds.map(mediaId => ({
            status: 'READY',
            media: mediaId
          }))
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    });

    return post;
  } catch (error) {
    console.error('LinkedIn posting error:', error);
    throw error;
  }
};