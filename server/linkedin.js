import fetch from 'node-fetch';

const LINKEDIN_API_URL = 'https://api.linkedin.com/v2';

export const createLinkedInClient = (accessToken) => {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0'
  };

  return {
    uploadMedia: async ({ mediaType, media }) => {
      // Step 1: Register upload
      const registerResponse = await fetch(`${LINKEDIN_API_URL}/assets?action=registerUpload`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: `urn:li:person:${process.env.LINKEDIN_PERSON_ID}`,
            serviceRelationships: [{
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent'
            }]
          }
        })
      });

      if (!registerResponse.ok) {
        throw new Error(`Failed to register media upload: ${registerResponse.statusText}`);
      }

      const { value } = await registerResponse.json();
      const uploadUrl = value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
      const asset = value.asset;

      // Step 2: Upload binary
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': mediaType === 'IMAGE' ? 'image/jpeg' : 'video/mp4'
        },
        body: media
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload media: ${uploadResponse.statusText}`);
      }

      return { value: { asset } };
    },

    createPost: async ({ author, specificContent, visibility }) => {
      const response = await fetch(`${LINKEDIN_API_URL}/ugcPosts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          author,
          lifecycleState: 'PUBLISHED',
          specificContent,
          visibility
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create post: ${error.message || response.statusText}`);
      }

      return response.json();
    }
  };
};

export const postToLinkedIn = async (client, { caption, mediaFiles = [] }) => {
  try {
    let mediaIds = [];

    // Upload media files if present
    if (mediaFiles.length > 0) {
      mediaIds = await Promise.all(
        mediaFiles.map(async (file) => {
          const mediaBuffer = await fetch(file.url).then((res) => res.buffer());
          const uploadResponse = await client.uploadMedia({
            mediaType: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO',
            media: mediaBuffer,
          });
          return uploadResponse.value.asset;
        })
      );
    }

    // Create post
    const post = await client.createPost({
      author: `urn:li:person:${process.env.LINKEDIN_PERSON_ID}`,
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: caption,
          },
          media: mediaIds.map((mediaId) => ({
            status: 'READY',
            media: mediaId,
          })),
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    });

    return post;
  } catch (error) {
    console.error('LinkedIn posting error:', error);
    throw error;
  }
};