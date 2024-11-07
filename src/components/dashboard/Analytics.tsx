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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PricingModal from '../modals/PricingModal';

interface AnalyticsData {
  timeRange: string;
  analytics: {
    date: string;
    platform: string;
    reach: number;
    impressions: number;
    engagement: number;
    shares: number;
  }[];
  totals: {
    reach: number;
    impressions: number;
    engagement: number;
    shares: number;
  };
}
interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  icon: React.ElementType;
  popular?: boolean;
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const { user } = useAuth();

  const hasAnalyticsAccess = () => {
    const subscription = user?.subscription;
    return subscription?.planId !== 'free' && subscription?.status === 'active';
  };
  const isFreeTier =  !hasAnalyticsAccess();
  useEffect(() => {
    if (!isFreeTier) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [timeRange, isFreeTier]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(
        `http://localhost:5000/api/analytics/overview?timeRange=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
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

  if (isFreeTier) {
    return (
      <div className="relative">
        {/* Blurred Analytics Background */}
        <div className="filter blur-sm pointer-events-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="h-20 bg-gray-100 rounded-lg"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="h-80 bg-gray-100 rounded-lg"></div>
          </div>
        </div>

        {/* Premium Feature Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm rounded-xl">
          <div className="text-center p-8 max-w-md">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Unlock Advanced Analytics
            </h3>
            <p className="text-gray-200 mb-6">
              Get detailed insights into your social media performance, engagement metrics, and audience growth with our Premium plan.
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredData = analyticsData?.analytics.filter(
    (item) => platformFilter === 'all' || item.platform === platformFilter
  ) || [];

  const getFilteredTotals = () => {
    return filteredData.reduce(
      (acc, curr) => ({
        reach: acc.reach + (curr.reach || 0),
        impressions: acc.impressions + (curr.impressions || 0),
        engagement: acc.engagement + (curr.engagement || 0),
        shares: acc.shares + (curr.shares || 0),
      }),
      { reach: 0, impressions: 0, engagement: 0, shares: 0 }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getGraphData = () => {
    const dates = [...new Set(filteredData.map((item) => item.date))].sort();
    return dates.map((date) => {
      const dayData = filteredData.filter((item) => item.date === date);
      return {
        date: formatDate(date),
        engagement: dayData.reduce((sum, item) => sum + (item.engagement || 0), 0),
        reach: dayData.reduce((sum, item) => sum + (item.reach || 0), 0),
      };
    });
  };

  const filteredTotals = getFilteredTotals();
  const graphData = getGraphData();
  const maxValue = Math.max(
    ...graphData.map((d) => Math.max(d.engagement || 0, d.reach || 0))
  );

  const metrics = [
    {
      title: 'Total Reach',
      value: filteredTotals.reach.toLocaleString(),
      change: '+12.5%',
      icon: Eye,
      color: 'blue',
    },
    {
      title: 'Engagement Rate',
      value: `${(
        (filteredTotals.engagement / (filteredTotals.impressions || 1)) *
        100
      ).toFixed(1)}%`,
      change: '+2.1%',
      icon: Heart,
      color: 'red',
    },
    {
      title: 'Comments',
      value: filteredTotals.engagement.toLocaleString(),
      change: '-0.8%',
      icon: MessageCircle,
      color: 'green',
    },
    {
      title: 'Shares',
      value: filteredTotals.shares.toLocaleString(),
      change: '+5.3%',
      icon: Share2,
      color: 'purple',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative max-w-md">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="twitter">Twitter</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div
            key={metric.title}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">{metric.title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {metric.value}
                </h3>
              </div>
              <div className={`p-3 bg-${metric.color}-100 rounded-lg`}>
                <metric.icon className={`w-6 h-6 text-${metric.color}-600`} />
              </div>
            </div>
            <div className="flex items-center mt-4">
              {metric.change.startsWith('+') ? (
                <ArrowUp className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm ${
                  metric.change.startsWith('+')
                    ? 'text-green-500'
                    : 'text-red-500'
                } ml-1`}
              >
                {metric.change}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                vs previous period
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Engagement Graph */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-900">
            Engagement Overview
          </h2>
          <div className="flex gap-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
              <span className="text-sm text-gray-600">Engagement</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
              <span className="text-sm text-gray-600">Reach</span>
            </div>
          </div>
        </div>

        <div className="relative h-80 mt-2">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-6 w-16 flex flex-col justify-between text-xs text-gray-500">
            {[...Array(6)].map((_, i) => (
              <span key={i} className="text-right pr-2">
                {Math.round((maxValue * (5 - i)) / 5).toLocaleString()}
              </span>
            ))}
          </div>

          {/* Grid lines */}
          <div className="absolute left-16 right-0 top-0 bottom-6 flex flex-col justify-between">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border-t border-gray-100 w-full"></div>
            ))}
          </div>

          {/* Bars */}
          <div className="absolute left-16 right-6 top-0 bottom-6 flex items-end justify-between">
            {graphData.map((data, i) => (
              <div
                key={i}
                className="flex-1 flex items-end justify-center space-x-2 h-full"
              >
                <div className="relative w-6 h-full group">
                  <div
                    className="absolute bottom-0 w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                    style={{
                      height: `${((data.engagement || 0) / maxValue) * 100}%`,
                      minHeight: data.engagement > 0 ? '2px' : '0',
                    }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                      {(data.engagement || 0).toLocaleString()} engagements
                    </div>
                  </div>
                </div>
                <div className="relative w-6 h-full group">
                  <div
                    className="absolute bottom-0 w-full bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600"
                    style={{
                      height: `${((data.reach || 0) / maxValue) * 100}%`,
                      minHeight: data.reach > 0 ? '2px' : '0',
                    }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                      {(data.reach || 0).toLocaleString()} reach
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* X-axis labels */}
          <div className="absolute left-16 right-6 bottom-0 flex justify-between text-xs text-gray-500">
            {graphData.map((data, i) => (
              <div key={i} className="text-center w-12">
                {data.date}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}