import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  TrendingUp,
  Users,
  ArrowUp,
  ArrowDown,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  Lock,
  Crown,
  Filter,
  ChevronDown,
  Zap,
  Award,
  TrendingDown,
  Loader2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PricingModal from '../modals/PricingModal';
import PerformanceGraph from './analytics/PerformanceGraph';
import PostsList from './analytics/PostsList';
import { analytics } from '../../utils/api';
import { TRIAL_LIMITS } from '../../types/trial';

interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  fill: boolean;
  tension: number;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface AnalyticsPost {
  id: string;
  caption: string;
  platform: string;
  engagement: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  date: string;
  createdAt: string;
}

interface AnalyticsData {
  timeRange: string;
  analytics: {
    date: string;
    platform: string;
    reach: number;
    impressions: number;
    engagement: number;
    shares: number;
    likes: number;
    comments: number;
    postId?: string;
  }[];
  posts: AnalyticsPost[];
  totals: {
    reach: number;
    impressions: number;
    engagement: number;
    shares: number;
  };
  engagementRate: number;
  totalReach: number;
  totalImpressions: number;
  topPosts: {
    id: string;
    content: string;
    engagement: number;
    platform: string;
  }[];
  platformStats: {
    platform: string;
    followers: number;
    engagement: number;
  }[];
}

const transformChartData = (analyticsData: AnalyticsData | null): ChartData | null => {
  if (!analyticsData?.analytics) return null;

  const dates = [...new Set(analyticsData.analytics.map(item => 
    new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  ))];

  const datasets: ChartDataset[] = [];
  const metrics = ['engagement', 'reach', 'impressions'] as const;
  const colors = {
    engagement: {
      line: 'rgb(99, 102, 241)',
      fill: 'rgba(99, 102, 241, 0.1)',
    },
    reach: {
      line: 'rgb(16, 185, 129)',
      fill: 'rgba(16, 185, 129, 0.1)',
    },
    impressions: {
      line: 'rgb(245, 158, 11)',
      fill: 'rgba(245, 158, 11, 0.1)',
    },
  };

  metrics.forEach(metric => {
    const data = dates.map(date => {
      const dayData = analyticsData.analytics.filter(
        item => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === date
      );
      return dayData.reduce((sum, item) => sum + (item[metric] || 0), 0);
    });

    datasets.push({
      label: metric.charAt(0).toUpperCase() + metric.slice(1),
      data,
      borderColor: colors[metric].line,
      backgroundColor: colors[metric].fill,
      fill: true,
      tension: 0.4,
    });
  });

  return {
    labels: dates,
    datasets
  };
};

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [performanceFilter, setPerformanceFilter] = useState('overall');
  const [comparisonMetric, setComparisonMetric] = useState('engagement');
  const { user } = useAuth();

  const isTrialUser = user?.subscription?.status === 'trial';

  useEffect(() => {
    if (!isTrialUser) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [timeRange, platformFilter, performanceFilter, isTrialUser]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      const response = await analytics.overview({
        timeRange,
        platform: platformFilter,
        performance: performanceFilter
      });
      
      setAnalyticsData(response.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const renderPerformanceFilters = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={() => setPerformanceFilter('overall')}
        className={`px-3 py-1 rounded-full text-sm ${
          performanceFilter === 'overall'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-700'
        }`}
      >
        Overall
      </button>
      <button
        onClick={() => setPerformanceFilter('top')}
        className={`px-3 py-1 rounded-full text-sm ${
          performanceFilter === 'top'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-700'
        }`}
      >
        <Zap className="w-3 h-3 inline mr-1" />
        Top Performing
      </button>
      <button
        onClick={() => setPerformanceFilter('trending')}
        className={`px-3 py-1 rounded-full text-sm ${
          performanceFilter === 'trending'
            ? 'bg-orange-100 text-orange-700'
            : 'bg-gray-100 text-gray-700'
        }`}
      >
        <TrendingUp className="w-3 h-3 inline mr-1" />
        Trending
      </button>
      <button
        onClick={() => setPerformanceFilter('underperforming')}
        className={`px-3 py-1 rounded-full text-sm ${
          performanceFilter === 'underperforming'
            ? 'bg-red-100 text-red-700'
            : 'bg-gray-100 text-gray-700'
        }`}
      >
        <TrendingDown className="w-3 h-3 inline mr-1" />
        Underperforming
      </button>
    </div>
  );

  if (isTrialUser) {
    return (
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm rounded-xl">
          <div className="text-center p-8 max-w-md">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Trial Account Limitations
            </h3>
            <p className="text-gray-200 mb-6">
              Trial accounts are limited to {TRIAL_LIMITS.maxAnalyticsDays} days of analytics history.
            </p>
            <button
              onClick={() => setShowPricingModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Upgrade to Premium
            </button>
          </div>
        </div>

        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>

            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Platforms</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="twitter">Twitter</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Compare:</span>
            <select
              value={comparisonMetric}
              onChange={(e) => setComparisonMetric(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="engagement">Engagement</option>
              <option value="reach">Reach</option>
              <option value="impressions">Impressions</option>
            </select>
          </div>
        </div>

        {renderPerformanceFilters()}

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Overview</h3>
              {analyticsData && (
                <PerformanceGraph data={transformChartData(analyticsData)} height={400} />
              )}
            </div>

            <PostsList
              posts={analyticsData?.posts.map(post => ({
                ...post,
                createdAt: post.date
              })) || []}
              metric={comparisonMetric}
            />
          </>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analyticsData?.engagementRate}%
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reach</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analyticsData?.totalReach.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Impressions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analyticsData?.totalImpressions.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Performance</h2>
          <div className="space-y-4">
            {analyticsData?.platformStats.map((stat) => (
              <div key={stat.platform} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {stat.platform}
                  </span>
                  <span className="text-sm text-gray-600">
                    {stat.followers.toLocaleString()} followers
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(stat.engagement / 5) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {stat.engagement}% engagement rate
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Posts */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Posts</h2>
          <div className="space-y-4">
            {analyticsData?.topPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{post.content}</p>
                  <p className="text-xs text-gray-500 mt-1 capitalize">
                    {post.platform} • {post.engagement} engagements
                  </p>
                </div>
                <div className="ml-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Top Post
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}