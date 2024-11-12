import { TwitterApi } from 'twitter-api-v2';

class SocialMediaManager {
    static async initializeClient(platform, { accessToken, accessSecret }) {
        try {
            switch (platform.toLowerCase()) {
                case 'twitter':
                    return new TwitterApi({
                        appKey: process.env.TWITTER_API_KEY,
                        appSecret: process.env.TWITTER_API_SECRET,
                        accessToken: accessToken,
                        accessSecret: accessSecret,
                    });
    
                case 'facebook':
                    throw new Error('Facebook integration not implemented');
                case 'instagram':
                    throw new Error('Instagram integration not implemented');
                case 'linkedin':
                    throw new Error('LinkedIn integration not implemented');
                default:
                    throw new Error(`Unsupported platform: ${platform}`);
            }
        } catch (error) {
            console.error(`Failed to initialize ${platform} client:`, error);
            throw error;
        }
    }
    

  static async publishContent(platform, client, postData) {
    try {
      switch (platform.toLowerCase()) {
        case 'twitter':
          return await this.publishToTwitter(client, postData);
        
        case 'facebook':
          // Implement Facebook publishing
          throw new Error('Facebook publishing not implemented');
        
        case 'instagram':
          // Implement Instagram publishing
          throw new Error('Instagram publishing not implemented');
        
        case 'linkedin':
          // Implement LinkedIn publishing
          throw new Error('LinkedIn publishing not implemented');
        
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      console.error(`Failed to publish to ${platform}:`, error);
      throw error;
    }
  }

  static async publishToTwitter(client, { caption, mediaFiles = [] }) {
    try {
      let mediaIds = [];

      // Upload media files if present
      if (mediaFiles.length > 0) {
        mediaIds = await Promise.all(
          mediaFiles.map(async (file) => {
            const mediaBuffer = await fetch(file.url).then(res => res.buffer());
            return client.v1.uploadMedia(mediaBuffer, {
              mimeType: file.type === 'image' ? 'image/jpeg' : 'video/mp4'
            });
          })
        );
      }

      // Create tweet
      const tweet = await client.v2.tweet({
        text: caption,
        media: mediaIds.length > 0 ? { media_ids: mediaIds } : undefined
      });

      return tweet;
    } catch (error) {
      console.error('Twitter posting error:', error);
      throw error;
    }
  }
}

export { SocialMediaManager };