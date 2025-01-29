import { PostStatus, SocialPlatform } from './notion';

export interface ContentSource {
  id: string;
  type: 'google_docs' | 'wordpress' | 'notion';
  name: string;
  connected: boolean;
  lastSync?: Date;
  config: any;
  userId: string;
  syncStatus?: SyncStatus[];
}

export interface ContentPost {
  id: string;
  sourceId: string;
  userId: string;
  title: string;
  content: string;
  platforms: string[];
  status: string;
  scheduledTime?: Date;
  images: string[];
  metadata: any;
  externalId: string;
}

export interface SyncStatus {
  id: string;
  sourceId: string;
  status: 'success' | 'error' | 'in_progress';
  itemsProcessed: number;
  error?: string;
  createdAt: Date;
}

export interface GoogleDocsConfig {
  accessToken: string;
  refreshToken: string;
  folderId?: string;
}

export interface WordPressConfig {
  siteUrl: string;
  accessToken: string;
  postTypes: string[];
}

export interface ContentSourceConfig {
  google_docs?: {
    folderId?: string;
    watchMode: 'realtime' | 'polling';
    autoSync: boolean;
    templateId?: string;
  };
  wordpress?: {
    siteUrl: string;
    postTypes: string[];
    categories?: string[];
    autoPost: boolean;
  };
}

export interface TransformationRule {
  sourceType: ContentSource['type'];
  platform: SocialPlatform;
  contentStrategy: {
    titleMaxLength: number;
    contentMaxLength: number;
    imageCount: number;
    hashtagLimit: number;
    formatRules: string[];
  };
}

export interface PostMetadata {
  hashtags?: string[];
  mentions?: string[];
  altText?: { [key: string]: string };
  platformSpecific?: {
    twitter?: {
      threadMode?: boolean;
      quoteStyle?: 'modern' | 'simple';
    };
    instagram?: {
      carouselMode?: boolean;
      filterPreset?: string;
    };
    linkedin?: {
      articleMode?: boolean;
      professionalTone?: boolean;
    };
  };
} 