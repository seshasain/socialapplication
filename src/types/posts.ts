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
  platform: string;
  hashtags: string;
  visibility: 'public' | 'private' | 'draft';
  status: 'scheduled' | 'published' | 'failed';
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
  platform: string;
  hashtags: string;
  visibility: string;
  mediaFiles: File[];
}
