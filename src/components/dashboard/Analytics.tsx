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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PricingModal from '../modals/PricingModal';
import PerformanceGraph from './analytics/PerformanceGraph';
import PostsList from './analytics/PostsList';

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
  posts: {
    id: string;
    caption: string;
    platform: string;
    engagement: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    date: string;
  }[];
  totals: {
    reach: number;
    impressions: number;
    engagement: number;
    shares: number;
  };
}

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

  const hasAnalyticsAccess = () => {
    const subscription = user?.subscription;
    return subscription?.planId !== 'free' && subscription?.status === 'active';
  };

  const isFreeTier = !hasAnalyticsAccess();

  useEffect(() => {
    if (!isFreeTier) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [timeRange, platformFilter, performanceFilter, comparisonMetric]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(
        `http://localhost:5000/api/analytics/overview?timeRange=${timeRange}&platform=${platformFilter}&performance=${performanceFilter}&metric=${comparisonMetric}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalyticsData(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch analytics'
      );
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (!analyticsData) return null;

    const dates = [...new Set(analyticsData.analytics.map(item => 
      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ))].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    const datasets = [];
    const metrics = ['engagement', 'reach', 'impressions'];
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
        const dayData = analyticsData.analytics.filter(item => {
          const itemDate = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return itemDate === date && (platformFilter === 'all' || item.platform === platformFilter);
        });
        return dayData.reduce((sum, item) => sum + (item[metric as keyof typeof item] as number || 0), 0);
      });

      datasets.push({
        label: metric.charAt(0).toUpperCase() + metric.slice(1),
        data,
        borderColor: colors[metric as keyof typeof colors].line,
        backgroundColor: colors[metric as keyof typeof colors].fill,
        fill: true,
        tension: 0.4,
      });
    });

    return {
      labels: dates,
      datasets
    };
  };

  const getFilteredPosts = () => {
    if (!analyticsData?.posts) return [];

    return analyticsData.posts
      .filter(post => platformFilter === 'all' || post.platform === platformFilter)
      .sort((a, b) => {
        const metricA = a[comparisonMetric as keyof typeof a] as number;
        const metricB = b[comparisonMetric as keyof typeof b] as number;
        return metricB - metricA;
      });
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

  if (isFreeTier) {
    return (
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm rounded-xl">
          <div className="text-center p-8 max-w-md">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Unlock Advanced Analytics
            </h3>
            <p className="text-gray-200 mb-6">
              Get detailed insights into your social media performance,
              engagement metrics, and audience growth with our Premium plan.
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Overview</h3>
              {getChartData() && (
                <PerformanceGraph data={getChartData()} height={400} />
              )}
            </div>

            <PostsList
              posts={getFilteredPosts()}
              metric={comparisonMetric}
            />
          </>
        )}
      </div>
    </div>
  );
}