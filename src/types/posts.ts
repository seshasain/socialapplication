import type { MediaFile, MediaType } from './media';

// Re-export MediaFile from media.ts
export type { MediaFile } from './media';

export interface PostPlatform {
  id: string;
  platform: string;
  status: 'published' | 'scheduled' | 'failed' | 'processing';
  publishedAt: string | null;
  error?: string;
  externalId?: string;
  settings?: Record<string, any>;
}

export interface Post {
  id: string;
  caption: string;
  scheduledDate: string;
  mediaFiles: MediaFile[];
  platforms: PostPlatform[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface PostFormData {
  caption: string;
  scheduledDate?: string;
  platforms: string[];
  mediaFiles: string[];
  settings?: Record<string, any>;
}