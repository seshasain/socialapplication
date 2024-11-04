export interface MediaFile {
  id: string;
  url: string;
  type: string;
  filename?: string;
  size?: number;
}

export interface PostPlatform {
  id: string;
  platform: string;
  status: string;
  error?: string;
  externalId?: string;
  publishedAt?: string;
}

export interface Post {
  id: string;
  caption: string;
  scheduledDate: string;
  hashtags?: string;
  visibility: string;
  status: string;
  error?: string;
  mediaFiles: MediaFile[];
  platforms: PostPlatform[];
  engagementRate?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostFormData {
  caption: string;
  scheduledDate?: string;
  scheduledTime?: string;
  selectedPlatforms?: string[];
  hashtags?: string;
  visibility: string;
  mediaFiles?: MediaFile[];
  publishNow?: boolean;
}

export interface SocialAccount {
  id: string;
  userId: string;
  platform: string;
  username: string;
  profileUrl: string;
  accessToken: string;
  refreshToken?: string;
  followerCount: number;
  createdAt: String;
  updatedAt: String;
}

