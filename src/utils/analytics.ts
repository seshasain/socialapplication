import { Post } from '../types/posts';

interface AnalyticsMetric {
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface PlatformMetrics {
  likes: AnalyticsMetric;
  comments: AnalyticsMetric;
  shares: AnalyticsMetric;
  impressions: AnalyticsMetric;
  engagement: AnalyticsMetric;
}

interface AnalyticsSummary {
  totalPosts: number;
  totalEngagement: number;
  averageEngagement: number;
  bestPerformingPlatform: string;
  bestPerformingPost: Post;
  metrics: Record<string, PlatformMetrics>;
}

interface ChartDataPoint {
  date: string;
  value: number;
  platform: string;
  metric: string;
}

const ENGAGEMENT_WEIGHTS = {
  likes: 1,
  comments: 2,
  shares: 3
};

export function calculateEngagement(metrics: Record<string, number>): number {
  return Object.entries(metrics).reduce((total, [key, value]) => {
    return total + (value * (ENGAGEMENT_WEIGHTS[key as keyof typeof ENGAGEMENT_WEIGHTS] || 1));
  }, 0);
}

export function calculateMetricChange(current: number, previous: number): AnalyticsMetric {
  const change = previous === 0 ? 100 : ((current - previous) / previous) * 100;
  return {
    value: current,
    change: Math.round(change * 100) / 100,
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
  };
}

export function aggregateMetrics(
  posts: Post[],
  timeRange: { start: string; end: string }
): AnalyticsSummary {
  const platforms = new Set<string>();
  const metrics: Record<string, PlatformMetrics> = {};
  let totalEngagement = 0;
  let bestPerformingPost: Post = posts[0];
  let maxEngagement = 0;

  // Initialize metrics for each platform
  posts.forEach(post => {
    post.platforms.forEach(platform => {
      platforms.add(platform.platform);
      if (!metrics[platform.platform]) {
        metrics[platform.platform] = {
          likes: { value: 0, change: 0, trend: 'stable' },
          comments: { value: 0, change: 0, trend: 'stable' },
          shares: { value: 0, change: 0, trend: 'stable' },
          impressions: { value: 0, change: 0, trend: 'stable' },
          engagement: { value: 0, change: 0, trend: 'stable' }
        };
      }
    });
  });

  // Calculate metrics for each platform
  posts.forEach(post => {
    post.platforms.forEach(platform => {
      const platformMetrics = metrics[platform.platform];
      if (platform.settings?.analytics) {
        const analytics = platform.settings.analytics;
        platformMetrics.likes.value += analytics.likes || 0;
        platformMetrics.comments.value += analytics.comments || 0;
        platformMetrics.shares.value += analytics.shares || 0;
        platformMetrics.impressions.value += analytics.impressions || 0;

        const engagement = calculateEngagement(analytics);
        platformMetrics.engagement.value += engagement;
        totalEngagement += engagement;

        if (engagement > maxEngagement) {
          maxEngagement = engagement;
          bestPerformingPost = post;
        }
      }
    });
  });

  // Calculate changes and trends
  platforms.forEach(platform => {
    const platformMetrics = metrics[platform];
    Object.keys(platformMetrics).forEach(key => {
      const metric = platformMetrics[key as keyof PlatformMetrics];
      const previousValue = metric.value * 0.8; // Simplified previous value calculation
      const updated = calculateMetricChange(metric.value, previousValue);
      platformMetrics[key as keyof PlatformMetrics] = updated;
    });
  });

  // Find best performing platform
  let bestPerformingPlatform = Array.from(platforms)[0];
  let maxPlatformEngagement = 0;
  platforms.forEach(platform => {
    const engagement = metrics[platform].engagement.value;
    if (engagement > maxPlatformEngagement) {
      maxPlatformEngagement = engagement;
      bestPerformingPlatform = platform;
    }
  });

  return {
    totalPosts: posts.length,
    totalEngagement,
    averageEngagement: totalEngagement / Math.max(posts.length, 1),
    bestPerformingPlatform,
    bestPerformingPost,
    metrics
  };
}

export function generateChartData(
  posts: Post[],
  metric: string = 'engagement',
  platforms: string[] = []
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const dateMap = new Map<string, Record<string, number>>();

  posts.forEach(post => {
    const date = post.createdAt.split('T')[0];
    if (!dateMap.has(date)) {
      dateMap.set(date, {});
    }

    post.platforms.forEach(platform => {
      if (platforms.length === 0 || platforms.includes(platform.platform)) {
        const analytics = platform.settings?.analytics || {};
        const value = metric === 'engagement'
          ? calculateEngagement(analytics)
          : analytics[metric] || 0;

        const platformData = dateMap.get(date)!;
        platformData[platform.platform] = (platformData[platform.platform] || 0) + value;
      }
    });
  });

  // Convert map to array of data points
  Array.from(dateMap.entries()).forEach(([date, platformData]) => {
    Object.entries(platformData).forEach(([platform, value]) => {
      data.push({
        date,
        value,
        platform,
        metric
      });
    });
  });

  return data.sort((a, b) => a.date.localeCompare(b.date));
}

export function formatMetricValue(value: number, metric: string): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

export function getMetricColor(metric: string): string {
  const colors: Record<string, string> = {
    likes: '#FF6B6B',
    comments: '#4ECDC4',
    shares: '#45B7D1',
    impressions: '#96CEB4',
    engagement: '#FFEEAD'
  };
  return colors[metric] || '#666666';
}

export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    facebook: '#1877F2',
    twitter: '#1DA1F2',
    instagram: '#E4405F',
    linkedin: '#0A66C2',
    youtube: '#FF0000'
  };
  return colors[platform.toLowerCase()] || '#666666';
} 