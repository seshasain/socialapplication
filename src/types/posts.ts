export interface MediaFile {
  id: string;
  userId: string;
  url: string;
  type: string;
  filename: string;
  size: number;
  s3Key: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  caption: string;
  scheduledDate: string;
  platforms: Array<{
    platform: string;
    status: string;
    publishedAt: string | null;
    error?: string;
    externalId?: string;
    settings?: Record<string, any>;
  }>;
  hashtags: string;
  visibility: 'public' | 'private' | 'draft';
  mediaFiles: MediaFile[];
  engagementRate?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostFormData {
  caption: string;
  scheduledDate: string;
  scheduledTime: string;
  platforms: Array<{
    platform: string;
    postType: string;
    settings?: Record<string, any>;
  }>;
  hashtags: string;
  visibility: string;
  mediaFiles: File[];
}