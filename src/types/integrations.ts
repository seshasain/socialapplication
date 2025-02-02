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
  status: 'published' | 'draft' | 'error';
  scheduledTime?: Date;
  images: string[];
  metadata: any;
  externalId: string;
  featuredImage?: string;
  excerpt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  url?: string;
  authors?: Array<{
    name: string;
    avatar?: string;
  }>;
}

export interface SyncStatus {
  id: string;
  sourceId: string;
  status: 'success' | 'error' | 'in_progress';
  itemsProcessed: number;
  totalItems: number;
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

export interface NotionConfig {
  accessToken: string;
  databaseId: string;
  workspaceId?: string;
  workspaceName?: string;
  workspaceIcon?: string;
  botId?: string;
}

export interface NotionPage {
  id: string;
  properties: {
    title: {
      title: Array<{
        plain_text: string;
      }>;
    };
    content: {
      rich_text: Array<{
        plain_text: string;
      }>;
    };
  };
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
  notion?: {
    databaseId: string;
    syncInterval: number;
    autoSync: boolean;
    templateId?: string;
    filterTags?: string[];
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