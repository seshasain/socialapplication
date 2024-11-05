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

export interface PostPlatform {
  id: string;
  postId: string;
  platform: string;
  status: string;
  error?: string;
  externalId?: string;
  settings: Record<string, any>;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}
export interface Post {
  id: string;
  userId: string;
  caption: string;
  scheduledDate: string;
  hashtags?: string;
  visibility: string;
  error?: string;
  mediaFiles: MediaFile[];
  platforms: PostPlatform[];
  externalPostId?: string;
  createdAt: string;
  updatedAt: string;
}
export interface PostFormData {
  caption: string;
  scheduledDate: string;
  scheduledTime: string;
  selectedPlatforms?: string[];
  hashtags?: string;
  visibility: string;
  mediaFiles?: MediaFile[];
  publishNow?: boolean;
}