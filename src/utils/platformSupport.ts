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
    };
    limits: {
      maxCharacters: number;
      maxHashtags: number;
      maxMedia: number;
      maxVideoLength: number;
      maxFileSize: number;
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
        analytics: true
      },
      limits: {
        maxCharacters: 2200,
        maxHashtags: 30,
        maxMedia: 10,
        maxVideoLength: 60,
        maxFileSize: 100
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
        carousel: false,
        scheduling: true,
        analytics: true
      },
      limits: {
        maxCharacters: 63206,
        maxHashtags: 30,
        maxMedia: 4,
        maxVideoLength: 240,
        maxFileSize: 4096
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
        analytics: true
      },
      limits: {
        maxCharacters: 280,
        maxHashtags: 30,
        maxMedia: 4,
        maxVideoLength: 140,
        maxFileSize: 512
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
        analytics: true
      },
      limits: {
        maxCharacters: 3000,
        maxHashtags: 30,
        maxMedia: 9,
        maxVideoLength: 600,
        maxFileSize: 5120
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