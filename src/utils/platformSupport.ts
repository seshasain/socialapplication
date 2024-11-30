interface PlatformSupport {
    api: boolean;
    oauth: boolean;
    postTypes: string[];
    features: string[];
  }
  
  export const PLATFORM_SUPPORT: Record<string, PlatformSupport> = {
    instagram: {
      api: true,
      oauth: true,
      postTypes: ['post', 'story', 'reel', 'carousel'],
      features: ['media', 'hashtags', 'location', 'mentions']
    },
    facebook: {
      api: true,
      oauth: true,
      postTypes: ['post', 'story', 'reel', 'event'],
      features: ['media', 'hashtags', 'location', 'mentions', 'feelings']
    },
    twitter: {
      api: true,
      oauth: true,
      postTypes: ['post', 'thread', 'poll'],
      features: ['media', 'hashtags', 'mentions', 'polls']
    },
    linkedin: {
      api: true,
      oauth: true,
      postTypes: ['post', 'article'],
      features: ['media', 'hashtags', 'mentions']
    },
    youtube: {
      api: false,
      oauth: true,
      postTypes: ['video', 'short'],
      features: ['media', 'hashtags', 'description']
    },
    tiktok: {
      api: false,
      oauth: false,
      postTypes: ['video'],
      features: ['media', 'hashtags', 'music']
    }
  };
  
  export function isPlatformSupported(platform: string): boolean {
    return platform in PLATFORM_SUPPORT && 
      (PLATFORM_SUPPORT[platform].api || PLATFORM_SUPPORT[platform].oauth);
  }
  
  export function getPostTypesForPlatform(platform: string): string[] {
    return PLATFORM_SUPPORT[platform]?.postTypes || [];
  }
  
  export function getPlatformFeatures(platform: string): string[] {
    return PLATFORM_SUPPORT[platform]?.features || [];
  }
  
  export function isPostTypeSupported(platform: string, postType: string): boolean {
    return PLATFORM_SUPPORT[platform]?.postTypes.includes(postType) || false;
  }