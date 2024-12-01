interface PlatformSupport {
    api: boolean;
    oauth: boolean;
    postTypes: string[];
    features: {
      media: boolean;
      hashtags: boolean;
      location: boolean;
      mentions: boolean;
      polls: boolean;
      stories: boolean;
      reels: boolean;
      carousel: boolean;
      scheduling: boolean;
      analytics: boolean;
      storyCaption: boolean; // Added to track story caption support
      storyHashtags: boolean; // Added to track story hashtag support
      storyMentions: boolean; // Added to track story mention support
      storyLinks: boolean; // Added to track story link support
    };
    limits: {
      maxCharacters: number;
      maxHashtags: number;
      maxMedia: number;
      maxVideoLength: number;
      maxFileSize: number;
      storyDuration: number; // Added for story duration limit
    };
  }
  
  export const PLATFORM_SUPPORT: Record<string, PlatformSupport> = {
    instagram: {
      api: true,
      oauth: true,
      postTypes: ['post', 'story', 'reel', 'carousel'],
      features: {
        media: true,
        hashtags: true,
        location: true,
        mentions: true,
        polls: false,
        stories: true,
        reels: true,
        carousel: true,
        scheduling: true,
        analytics: true,
        storyCaption: false, // Instagram stories don't support captions
        storyHashtags: true, // Instagram stories support hashtags as stickers
        storyMentions: true,
        storyLinks: true // Only for business accounts with >10k followers
      },
      limits: {
        maxCharacters: 2200,
        maxHashtags: 30,
        maxMedia: 10,
        maxVideoLength: 60,
        maxFileSize: 100,
        storyDuration: 15 // 15 seconds for stories
      }
    },
    facebook: {
      api: true,
      oauth: true,
      postTypes: ['post', 'story', 'reel'],
      features: {
        media: true,
        hashtags: true,
        location: true,
        mentions: true,
        polls: true,
        stories: true,
        reels: true,
        carousel: true,
        scheduling: true,
        analytics: true,
        storyCaption: true, // Facebook stories support captions
        storyHashtags: true,
        storyMentions: true,
        storyLinks: true
      },
      limits: {
        maxCharacters: 63206,
        maxHashtags: 30,
        maxMedia: 4,
        maxVideoLength: 240,
        maxFileSize: 4096,
        storyDuration: 20
      }
    },
    twitter: {
      api: true,
      oauth: true,
      postTypes: ['post', 'thread'],
      features: {
        media: true,
        hashtags: true,
        location: false,
        mentions: true,
        polls: true,
        stories: false,
        reels: false,
        carousel: false,
        scheduling: true,
        analytics: true,
        storyCaption: false,
        storyHashtags: false,
        storyMentions: false,
        storyLinks: false
      },
      limits: {
        maxCharacters: 280,
        maxHashtags: 30,
        maxMedia: 4,
        maxVideoLength: 140,
        maxFileSize: 512,
        storyDuration: 0
      }
    },
    linkedin: {
      api: true,
      oauth: true,
      postTypes: ['post', 'article'],
      features: {
        media: true,
        hashtags: true,
        location: false,
        mentions: true,
        polls: false,
        stories: false,
        reels: false,
        carousel: false,
        scheduling: true,
        analytics: true,
        storyCaption: false,
        storyHashtags: false,
        storyMentions: false,
        storyLinks: false
      },
      limits: {
        maxCharacters: 3000,
        maxHashtags: 30,
        maxMedia: 9,
        maxVideoLength: 600,
        maxFileSize: 5120,
        storyDuration: 0
      }
    }
  };
  
  export function isPlatformSupported(platform: string): boolean {
    return platform in PLATFORM_SUPPORT && 
      (PLATFORM_SUPPORT[platform].api || PLATFORM_SUPPORT[platform].oauth);
  }
  
  export function getPostTypesForPlatform(platform: string): string[] {
    return PLATFORM_SUPPORT[platform]?.postTypes || [];
  }
  
  export function getPlatformFeatures(platform: string): Record<string, boolean> {
    return PLATFORM_SUPPORT[platform]?.features || {};
  }
  
  export function getPlatformLimits(platform: string) {
    return PLATFORM_SUPPORT[platform]?.limits;
  }
  
  export function isPostTypeSupported(platform: string, postType: string): boolean {
    return PLATFORM_SUPPORT[platform]?.postTypes.includes(postType) || false;
  }
  
  export function isFeatureSupported(platform: string, feature: string): boolean {
    return PLATFORM_SUPPORT[platform]?.features[feature as keyof PlatformSupport['features']] || false;
  }
  
  export function getStoryFeatures(platform: string) {
    const features = PLATFORM_SUPPORT[platform]?.features;
    if (!features) return null;
  
    return {
      supportsCaption: features.storyCaption,
      supportsHashtags: features.storyHashtags,
      supportsMentions: features.storyMentions,
      supportsLinks: features.storyLinks,
      duration: PLATFORM_SUPPORT[platform]?.limits.storyDuration || 0
    };
  }