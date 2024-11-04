import { createTwitterClient, postToTwitter } from './twitter.js';
import { createFacebookClient, postToFacebook } from './facebook.js';
import { createInstagramClient, authenticateInstagram, postToInstagram } from './instagram.js';
import { createLinkedInClient, postToLinkedIn } from './linkedin.js';

export const initializeSocialClient = async (platform, credentials) => {
  try {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return createTwitterClient(credentials.accessToken, credentials.accessSecret);
      
      case 'facebook':
        return createFacebookClient(credentials.accessToken);
      
      case 'instagram':
        const igClient = createInstagramClient(credentials.username);
        await authenticateInstagram(igClient, credentials.username, credentials.password);
        return igClient;
      
      case 'linkedin':
        return createLinkedInClient(credentials.accessToken);
      
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  } catch (error) {
    console.error(`Failed to initialize ${platform} client:`, error);
    throw error;
  }
};

export const publishToSocialMedia = async (platform, client, postData) => {
  try {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return await postToTwitter(client, postData);
      
      case 'facebook':
        return await postToFacebook(client, postData);
      
      case 'instagram':
        return await postToInstagram(client, postData);
      
      case 'linkedin':
        return await postToLinkedIn(client, postData);
      
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  } catch (error) {
    console.error(`Failed to publish to ${platform}:`, error);
    throw error;
  }
};