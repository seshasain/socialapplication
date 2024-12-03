import type { MediaFile } from './media';
export type PostType = 
  | 'post' 
  | 'story' 
  | 'reel' 
  | 'thread' 
  | 'carousel' 
  | 'article'
  | 'poll'
  | 'event';
export type PostStatus = 
  | 'draft'
  | 'scheduled'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'partial';
export type Platform = 
  | 'twitter'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'tiktok';
export interface PostPlatform {
  id: string;
  platform: Platform;
  status: PostStatus;
  error?: string;
  externalId?: string;
  settings?: PlatformSettings;
  publishedAt?: string | null;
  scheduledTime?: string;
}
export interface Post {
  id: string;
  caption: string;
  scheduledDate: string;
  platforms: PostPlatform[];
  hashtags: string;
  visibility: 'public' | 'private' | 'draft';
  mediaFiles: MediaFile[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadPost {
  id: string;
  content: string;
  mediaFiles: MediaFile[];
  scheduledTime?: string;
}

export interface PlatformSettings {
  // Twitter-specific settings
  twitter?: {
    replySettings?: 'everyone' | 'following' | 'mentioned';
    quoteRetweets?: boolean;
    threadSettings?: {
      numberedThreads: boolean;
      addFollowupPrompt: boolean;
    };
    pollSettings?: {
      options: string[];
      duration: '1d' | '3d' | '7d';
    };
  };

  // Instagram-specific settings
  instagram?: {
    location?: string;
    altText?: string;
    enableComments: boolean;
    enableLikes: boolean;
    storySettings?: {
      enablePolls: boolean;
      enableQuestions: boolean;
      enableMusic: boolean;
      enableLocation: boolean;
      layout: 'default' | 'fullscreen' | 'split';
    };
    reelSettings?: {
      shareToFeed: boolean;
      allowRemix: boolean;
      music?: string;
    };
    carouselSettings?: {
      enableTags: boolean;
      enableProducts: boolean;
    };
  };

  // Facebook-specific settings
  facebook?: {
    enableComments: boolean;
    enableSharing: boolean;
    audience: 'public' | 'friends' | 'friends-except' | 'specific-friends' | 'only-me';
    eventSettings?: {
      eventName: string;
      startDateTime: string;
      endDateTime: string;
      location: string;
      eventType: 'public' | 'private' | 'online';
    };
  };

  // LinkedIn-specific settings
  linkedin?: {
    visibility: 'anyone' | 'connections' | 'group';
    notifyEmployees: boolean;
    enableComments: boolean;
    articleSettings?: {
      title: string;
      subtitle?: string;
      coverImage?: string;
    };
  };

  // TikTok-specific settings
  tiktok?: {
    allowDuets: boolean;
    allowStitches: boolean;
    privacyLevel: 'public' | 'friends' | 'private';
    allowComments: boolean;
  };
}

export interface PostFormData {
  caption: string;
  scheduledDate: string;
  scheduledTime: string;
  platforms: Array<{
    platform: Platform;
    postType: PostType;
    settings?: PlatformSettings;
  }>;
  hashtags: string;
  visibility: string;
  mediaFiles: MediaFile[];
  threadContent?: string[];
  threadMedia?: Record<string, MediaFile[]>;
}

export interface PostValidationError {
  platform: string;
  message: string;
}