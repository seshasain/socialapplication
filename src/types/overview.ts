export interface OverviewStats {
  totalPosts: number;
  engagementRate: number;
  totalFollowers: number;
  scheduledPosts: number;
}

export interface Post {
  id: string;
  title: string;
  platform: string;
  scheduledDate: string;
  caption: string;
  hashtags: string;
  visibility: string;
}

export interface SocialAccount {
  id: string;
  platform: string;
  followerCount: number;
  username?: string;
  profileUrl?: string;
  accessToken: string;
  refreshToken?: string;
}