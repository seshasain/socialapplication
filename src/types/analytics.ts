import { Post } from './posts';

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

export interface AnalyticsParams {
  timeRange: 'day' | 'week' | 'month' | 'year';
  platform?: string;
  startDate?: string;
  endDate?: string;
} 