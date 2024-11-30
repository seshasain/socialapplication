import type { MediaFile } from '../types/media';

const PLATFORM_LIMITS = {
  twitter: {
    maxCharacters: 280,
    maxVideoLength: 140,
    maxVideoSize: 512,
    maxImages: 4,
    maxVideos: 1,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'image/webp'],
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

export function validatePlatformContent(platform: string, fullText: string, mediaFiles: MediaFile[]) {
  const errors: Array<{ platform: string; message: string }> = [];
  const limits = PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS];
  
  if (!limits) {
    errors.push({
      platform,
      message: `Unsupported platform: ${platform}`
    });
    return errors;
  }

  // Text length validation
  if (fullText.length > limits.maxCharacters) {
    errors.push({
      platform,
      message: `Text exceeds ${limits.maxCharacters} characters limit for ${platform}`
    });
  }

  // Media validations
  if (mediaFiles.length > 0) {
    const images = mediaFiles.filter(file => file.type.startsWith('image/'));
    const videos = mediaFiles.filter(file => file.type.startsWith('video/'));
    const gifs = mediaFiles.filter(file => file.type === 'image/gif');

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
      // Handle generic image type
      const actualType = file.type === 'image' ? 'image/png' : file.type;
      
      if (!limits.supportedMediaTypes.includes(actualType)) {
        errors.push({
          platform,
          message: `File type ${actualType} is not supported on ${platform}`
        });
        return;
      }

      const sizeInMB = file.size / (1024 * 1024);
      const isImage = actualType.startsWith('image/');
      const isVideo = actualType.startsWith('video/');
      const isGif = actualType === 'image/gif';

      if (isImage && !isGif && sizeInMB > limits.maxMediaSize.image) {
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

      if (isGif && sizeInMB > limits.maxMediaSize.gif) {
        errors.push({
          platform,
          message: `GIF size exceeds ${limits.maxMediaSize.gif}MB limit for ${platform}`
        });
      }
    });

    // Platform-specific validations
    switch (platform) {
      case 'twitter':
        if (images.length > 0 && videos.length > 0) {
          errors.push({
            platform,
            message: 'Twitter does not support mixing images and videos in the same post'
          });
        }
        break;
      case 'instagram':
        if (videos.length > 0 && images.length > 0) {
          errors.push({
            platform,
            message: 'Instagram does not support mixing videos and images in the same post'
          });
        }
        break;
    }
  }

  return errors;
}

export function getPlatformLimits(platform: string) {
  return PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS];
}