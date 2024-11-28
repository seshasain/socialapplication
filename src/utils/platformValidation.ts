import type { MediaFile } from '../types/media';

const PLATFORM_LIMITS = {
  twitter: {
    maxCharacters: 280,
    maxVideoLength: 140,
    maxVideoSize: 512,
    maxImages: 4,
    maxVideos: 1,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
  },
  instagram: {
    maxCharacters: 2200,
    maxVideoLength: 60,
    maxVideoSize: 100,
    maxImages: 10,
    maxVideos: 1,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
  },
  facebook: {
    maxCharacters: 63206,
    maxVideoLength: 240,
    maxVideoSize: 4096,
    maxImages: 10,
    maxVideos: 1,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
  },
  linkedin: {
    maxCharacters: 3000,
    maxVideoLength: 600,
    maxVideoSize: 5120,
    maxImages: 9,
    maxVideos: 1,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
  },
  youtube: {
    maxCharacters: 5000,
    maxVideoLength: 43200,
    maxVideoSize: 128000,
    maxImages: 1,
    maxVideos: 1,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
  },
};

export function validatePlatformContent(platform: string, fullText: string, mediaFiles: MediaFile[]) {
  const errors: Array<{ platform: string; message: string }> = [];
  const limits = PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS];
  
  if (!limits) return errors;

  // Text length validation
  if (fullText.length > limits.maxCharacters) {
    errors.push({
      platform,
      message: `Text exceeds ${limits.maxCharacters} characters limit for ${platform}`,
    });
  }

  // Media validations
  const images = mediaFiles.filter(file => file.type.startsWith('image/'));
  const videos = mediaFiles.filter(file => file.type.startsWith('video/'));

  if (images.length > limits.maxImages) {
    errors.push({
      platform,
      message: `Maximum ${limits.maxImages} images allowed for ${platform}`,
    });
  }

  if (videos.length > limits.maxVideos) {
    errors.push({
      platform,
      message: `Maximum ${limits.maxVideos} videos allowed for ${platform}`,
    });
  }

  // Media type support
  mediaFiles.forEach(file => {
    if (!limits.supportedMediaTypes.includes(file.type)) {
      errors.push({
        platform,
        message: `${file.type} is not supported on ${platform}`,
      });
    }
  });

  return errors;
}