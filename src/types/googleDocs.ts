import { PostStatus, SocialPlatform } from './notion';

export interface GoogleDocsConfig {
  folderId?: string;
  accessToken: string;
  refreshToken: string;
}

export interface GoogleDocsPost {
  id: string;
  title: string;
  content: string;
  lastModified: Date;
  createdAt: Date;
  platforms: SocialPlatform[];
  status: PostStatus;
  images: string[];
}

export interface GoogleDocsFolder {
  id: string;
  name: string;
  description?: string;
}

export interface GoogleDocsConnectionState {
  isConnected: boolean;
  selectedFolder?: GoogleDocsFolder;
  lastSync?: Date;
  step: number;
}

export enum GoogleDocsPostStatus {
  DRAFT = 'draft',
  READY = 'ready',
  PUBLISHED = 'published'
}

// Special metadata we'll add to Google Docs
export interface GoogleDocsMetadata {
  scheduledTime?: string;
  targetPlatforms?: string[];
  postStatus?: GoogleDocsPostStatus;
  tags?: string[];
  imageAltText?: { [key: string]: string };
} 