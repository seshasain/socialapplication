import type { MediaFile } from '../types/media';
import { ValidationError } from '../types/errors';

export type PlatformName = 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube';

interface PlatformLimits {
  maxCharacters: number;
  maxMedia: number;
  maxVideoLength: number;
  maxImageSize: number;
  supportedMediaTypes: string[];
}

interface PlatformSettings {
  limits: PlatformLimits;
  features: {
    scheduling: boolean;
    hashtags: boolean;
    mentions: boolean;
    links: boolean;
    geotags: boolean;
  };
}

const PLATFORM_SETTINGS: Record<PlatformName, PlatformSettings> = {
  facebook: {
    limits: {
      maxCharacters: 63206,
      maxMedia: 10,
      maxVideoLength: 240,
      maxImageSize: 30 * 1024 * 1024,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4']
    },
    features: {
      scheduling: true,
      hashtags: true,
      mentions: true,
      links: true,
      geotags: true
    }
  },
  twitter: {
    limits: {
      maxCharacters: 280,
      maxMedia: 4,
      maxVideoLength: 140,
      maxImageSize: 5 * 1024 * 1024,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4']
    },
    features: {
      scheduling: true,
      hashtags: true,
      mentions: true,
      links: true,
      geotags: true
    }
  },
  instagram: {
    limits: {
      maxCharacters: 2200,
      maxMedia: 10,
      maxVideoLength: 60,
      maxImageSize: 8 * 1024 * 1024,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4']
    },
    features: {
      scheduling: true,
      hashtags: true,
      mentions: true,
      links: false,
      geotags: true
    }
  },
  linkedin: {
    limits: {
      maxCharacters: 3000,
      maxMedia: 9,
      maxVideoLength: 600,
      maxImageSize: 10 * 1024 * 1024,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4']
    },
    features: {
      scheduling: true,
      hashtags: true,
      mentions: true,
      links: true,
      geotags: false
    }
  },
  youtube: {
    limits: {
      maxCharacters: 5000,
      maxMedia: 1,
      maxVideoLength: 43200,
      maxImageSize: 2 * 1024 * 1024,
      supportedMediaTypes: ['video/mp4', 'video/quicktime']
    },
    features: {
      scheduling: true,
      hashtags: true,
      mentions: false,
      links: true,
      geotags: false
    }
  }
};

export function validatePostContent(
  platform: PlatformName,
  caption: string,
  mediaFiles: MediaFile[] = []
): void {
  const settings = PLATFORM_SETTINGS[platform];
  if (!settings) {
    throw new ValidationError(`Unsupported platform: ${platform}`);
  }

  // Validate caption length
  if (caption.length > settings.limits.maxCharacters) {
    throw new ValidationError(
      `Caption exceeds maximum length of ${settings.limits.maxCharacters} characters for ${platform}`,
      'caption'
    );
  }

  // Validate media count
  if (mediaFiles.length > settings.limits.maxMedia) {
    throw new ValidationError(
      `Too many media files. ${platform} supports up to ${settings.limits.maxMedia} files`,
      'mediaFiles'
    );
  }

  // Validate media types
  mediaFiles.forEach(file => {
    if (!settings.limits.supportedMediaTypes.includes(file.type)) {
      throw new ValidationError(
        `Unsupported media type ${file.type} for ${platform}`,
        'mediaFiles'
      );
    }
  });
}

export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
  return text.match(hashtagRegex) || [];
}

export function extractMentions(text: string): string[] {
  const mentionRegex = /@[\w]+/g;
  return text.match(mentionRegex) || [];
}

export function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s]+/g;
  return text.match(urlRegex) || [];
}

export function formatCaption(
  platform: PlatformName,
  caption: string,
  options: {
    shortenLinks?: boolean;
    removeUnsupportedFeatures?: boolean;
  } = {}
): string {
  const settings = PLATFORM_SETTINGS[platform];
  let formatted = caption;

  if (options.shortenLinks) {
    const urls = extractUrls(formatted);
    urls.forEach(url => {
      formatted = formatted.replace(url, `${url.substring(0, 23)}...`);
    });
  }

  if (options.removeUnsupportedFeatures) {
    if (!settings.features.hashtags) {
      formatted = formatted.replace(/#[\w\u0590-\u05ff]+/g, '');
    }
    if (!settings.features.mentions) {
      formatted = formatted.replace(/@[\w]+/g, '');
    }
    if (!settings.features.links) {
      formatted = formatted.replace(/https?:\/\/[^\s]+/g, '');
    }
  }

  return formatted.trim();
}

export function getPlatformLimits(platform: PlatformName): PlatformLimits {
  const settings = PLATFORM_SETTINGS[platform];
  if (!settings) {
    throw new ValidationError(`Unsupported platform: ${platform}`);
  }
  return settings.limits;
}

export function getPlatformFeatures(platform: PlatformName) {
  const settings = PLATFORM_SETTINGS[platform];
  if (!settings) {
    throw new ValidationError(`Unsupported platform: ${platform}`);
  }
  return settings.features;
}

export function calculateRemainingCharacters(
  platform: PlatformName,
  caption: string,
  options: {
    countLinks?: boolean;
    countHashtags?: boolean;
    countMentions?: boolean;
  } = {}
): number {
  const settings = PLATFORM_SETTINGS[platform];
  let length = caption.length;

  if (!options.countLinks) {
    const urls = extractUrls(caption);
    urls.forEach(url => {
      length -= url.length;
      length += 23; // Standard shortened URL length
    });
  }

  if (!options.countHashtags) {
    const hashtags = extractHashtags(caption);
    hashtags.forEach(hashtag => {
      length -= hashtag.length;
    });
  }

  if (!options.countMentions) {
    const mentions = extractMentions(caption);
    mentions.forEach(mention => {
      length -= mention.length;
    });
  }

  return settings.limits.maxCharacters - length;
}

export function suggestHashtags(platform: PlatformName, text: string): string[] {
  // This is a simplified version. In a real application, you'd want to:
  // 1. Use a proper NLP library for keyword extraction
  // 2. Maintain a database of trending hashtags
  // 3. Consider platform-specific trending topics
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);

  return Array.from(new Set(words))
    .slice(0, 5)
    .map(word => `#${word}`);
}

export function validateScheduledTime(
  platform: PlatformName,
  scheduledTime: Date
): void {
  const now = new Date();
  const minTime = new Date(now.getTime() + 5 * 60000); // 5 minutes from now
  const maxTime = new Date(now.getTime() + 30 * 24 * 60 * 60000); // 30 days from now

  if (scheduledTime < minTime) {
    throw new ValidationError(
      'Scheduled time must be at least 5 minutes in the future',
      'scheduledTime'
    );
  }

  if (scheduledTime > maxTime) {
    throw new ValidationError(
      'Scheduled time cannot be more than 30 days in the future',
      'scheduledTime'
    );
  }
} 