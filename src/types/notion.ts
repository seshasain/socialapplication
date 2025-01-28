export interface NotionConfig {
  databaseId: string;
  accessToken: string;
}

export interface NotionPost {
  id?: string;
  title: string;
  content: string;
  platforms: SocialPlatform[];
  scheduledTime: Date;
  status: PostStatus;
  images?: string[];
}

export enum PostStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published'
}

export enum SocialPlatform {
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram'
}

export interface NotionDatabase {
  id: string;
  title: string;
  description?: string;
}

export interface NotionConnectionState {
  isConnected: boolean;
  selectedDatabase?: NotionDatabase;
  lastSync?: Date;
}

export interface NotionError {
  message: string;
  code: string;
  details?: any;
} 