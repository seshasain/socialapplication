// Define the platform-specific types
interface PlatformLimits {
  maxCharacters: number;
  maxVideoLength: number;
  maxVideoSize: number;
  maxImages: number;
  maxVideos: number;
  supportedMediaTypes: string[];
  maxMediaSize: {
    image: number;
    video: number;
    gif?: number;  // Optional property
    carousel?: number;
    story?: number;
    document?: number;
  };
}

interface TwitterLimits extends PlatformLimits {
  maxThreads: number;  // Twitter-specific property
}

// Define the platform type union
type PlatformType = {
  twitter: TwitterLimits;
  instagram: PlatformLimits;
  facebook: PlatformLimits;
  linkedin: PlatformLimits;
};

// Define the PLATFORM_LIMITS object with proper types
const PLATFORM_LIMITS: PlatformType = {
  twitter: {
    maxCharacters: 280,
    maxVideoLength: 140,
    maxVideoSize: 512,
    maxImages: 4,
    maxVideos: 1,
    maxThreads: 25, // Twitter-specific
    supportedMediaTypes: [
      'image',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'image/webp'
    ],
    maxMediaSize: {
      image: 5, // 5MB for images
      video: 512, // 512MB for videos
      gif: 15 // 15MB for GIFs
    }
  },
  instagram: {
    maxCharacters: 2200,
    maxVideoLength: 60,
    maxVideoSize: 100,
    maxImages: 10,
    maxVideos: 1,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
    maxMediaSize: {
      image: 8, // 8MB for images
      video: 100, // 100MB for videos
      carousel: 10 // 10 images max in carousel
    }
  },
  facebook: {
    maxCharacters: 63206,
    maxVideoLength: 240,
    maxVideoSize: 4096,
    maxImages: 10,
    maxVideos: 1,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
    maxMediaSize: {
      image: 30, // 30MB for images
      video: 4096, // 4GB for videos
      story: 4096 // 4GB for stories
    }
  },
  linkedin: {
    maxCharacters: 3000,
    maxVideoLength: 600,
    maxVideoSize: 5120,
    maxImages: 9,
    maxVideos: 1,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
    maxMediaSize: {
      image: 10, // 10MB for images
      video: 5120, // 5GB for videos
      document: 100 // 100MB for documents
    }
  }
};

// Define the MediaFile type (assuming this structure based on the context)
interface MediaFile {
  type: string;
  size: number;
  url: string;
  filename: string;
}

// Function to validate platform content
export function validatePlatformContent(
  platform: string, 
  fullText: string, 
  mediaFiles: MediaFile[], 
  threadContent?: string[]
) {
  const errors: Array<{ platform: string; message: string }> = [];
  const limits = PLATFORM_LIMITS[platform as keyof PlatformType];
  
  if (!limits) {
    errors.push({
      platform,
      message: `Unsupported platform: ${platform}`
    });
    return errors;
  }

  // Special handling for Twitter threads
  if (platform === 'twitter' && threadContent && threadContent.length > 0) {
    // Type guard to narrow the type to TwitterLimits
    const twitterLimits = limits as TwitterLimits;

    // Validate each tweet in the thread
    threadContent.forEach((tweet, index) => {
      if (!tweet.trim()) {
        errors.push({
          platform,
          message: `Tweet ${index + 1} cannot be empty`
        });
      } else if (tweet.length > twitterLimits.maxCharacters) {
        errors.push({
          platform,
          message: `Tweet ${index + 1} exceeds ${twitterLimits.maxCharacters} characters`
        });
      }
    });

    // Check thread length limit
    if (threadContent.length > twitterLimits.maxThreads) {
      errors.push({
        platform,
        message: `Thread exceeds maximum of ${twitterLimits.maxThreads} tweets`
      });
    }

    // Return early since we've handled thread validation
    return errors;
  }

  // Regular post validation (non-thread)
  if (fullText.length > limits.maxCharacters) {
    errors.push({
      platform,
      message: `Text exceeds ${limits.maxCharacters} characters limit for ${platform}`
    });
  }

  // Media validations remain unchanged...
  if (mediaFiles.length > 0) {
    const images = mediaFiles.filter(file => 
      file.type.startsWith('image/') && file.type !== 'image/gif'
    );
    const videos = mediaFiles.filter(file => 
      file.type.startsWith('video/')
    );
    const gifs = mediaFiles.filter(file => 
      file.type === 'image/gif'
    );

    // Check media count limits
    if (images.length > limits.maxImages) {
      errors.push({
        platform,
        message: `Maximum ${limits.maxImages} images allowed for ${platform}`
      });
    }

    if (videos.length > limits.maxVideos) {
      errors.push({
        platform,
        message: `Maximum ${limits.maxVideos} videos allowed for ${platform}`
      });
    }

    // Check media type support and size limits
    mediaFiles.forEach(file => {
      const mimeType = file.type.toLowerCase();
      
      if (!limits.supportedMediaTypes.includes(mimeType)) {
        errors.push({
          platform,
          message: `File type ${mimeType} is not supported on ${platform}`
        });
        return;
      }

      const sizeInMB = file.size / (1024 * 1024);
      const isImage = mimeType.startsWith('image/') && mimeType !== 'image/gif';
      const isVideo = mimeType.startsWith('video/');
      const isGif = mimeType === 'image/gif';

      if (isImage && sizeInMB > limits.maxMediaSize.image) {
        errors.push({
          platform,
          message: `Image size exceeds ${limits.maxMediaSize.image}MB limit for ${platform}`
        });
      }

      if (isVideo && sizeInMB > limits.maxMediaSize.video) {
        errors.push({
          platform,
          message: `Video size exceeds ${limits.maxMediaSize.video}MB limit for ${platform}`
        });
      }

      if (isGif && limits.maxMediaSize.gif && sizeInMB > limits.maxMediaSize.gif) {
        errors.push({
          platform,
          message: `GIF size exceeds ${limits.maxMediaSize.gif}MB limit for ${platform}`
        });
      }
    });

    // Platform-specific media validations
    if (platform === 'twitter') {
      if (images.length > 0 && videos.length > 0) {
        errors.push({
          platform,
          message: 'Twitter does not support mixing images and videos in the same post'
        });
      }
      if (gifs.length > 0 && (images.length > 0 || videos.length > 0)) {
        errors.push({
          platform,
          message: 'Twitter does not support mixing GIFs with other media types'
        });
      }
    }
  }

  return errors;
}

// Function to get platform limits
export function getPlatformLimits(platform: string) {
  return PLATFORM_LIMITS[platform as keyof PlatformType];
}
