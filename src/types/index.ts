import type { Post, MediaFile, PostPlatform, PostFormData } from './posts';

export type { Post, MediaFile, PostPlatform, PostFormData };

// Common interfaces
export interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  profilePicture?: string;
  status: 'connected' | 'disconnected' | 'error';
  error?: string;
  lastSync?: string;
  settings?: {
    [key: string]: any;
  };
  followerCount: number;
  accessToken: string;
}

export interface AnalyticsParams {
  timeRange: 'day' | 'week' | 'month' | 'year';
  platform?: string;
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsMetric {
  date: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
}

export interface AnalyticsTotals {
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
}

export interface AnalyticsData {
  timeRange: string;
  analytics: AnalyticsMetric[];
  posts: Post[];
  totals: AnalyticsTotals;
} 