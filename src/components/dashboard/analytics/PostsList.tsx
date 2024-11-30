import React, { useState } from 'react';
import { Eye, Heart, MessageCircle, Share2, TrendingUp, Calendar, ArrowUp, ArrowDown, Filter, Search, SlidersHorizontal, Instagram, Facebook, Twitter, Linkedin, Youtube } from 'lucide-react';

interface Post {
  id: string;
  caption: string;
  platform: string;
  engagement: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
}

interface PostsListProps {
  posts: Post[];
  metric: string;
}

export default function PostsList({ posts = [], metric }: PostsListProps) {
  const [sortConfig, setSortConfig] = useState({
    key: metric,
    direction: 'desc' as 'asc' | 'desc'
  });
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [performanceFilter, setPerformanceFilter] = useState('all');

  const getPlatformIcon = (platform: string | undefined) => {
    if (!platform) return null;
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'facebook':
        return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'twitter':
        return <Twitter className="w-4 h-4 text-sky-500" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4 text-blue-700" />;
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getMetricValue = (post: Post, metricKey: string) => {
    switch (metricKey.toLowerCase()) {
      case 'engagement':
        return post.engagement;
      case 'reach':
        return post.reach;
      case 'impressions':
        return Math.round(post.reach * 1.2);
      case 'likes':
        return post.likes;
      case 'comments':
        return post.comments;
      case 'shares':
        return post.shares;
        case 'platform':
          return post.platform;
      default:
        return 0;
    }
  };

  const getMetricIcon = (metricKey: string) => {
    switch (metricKey.toLowerCase()) {
      case 'engagement':
        return <TrendingUp className="w-4 h-4 text-indigo-500" />;
      case 'reach':
        return <Eye className="w-4 h-4 text-green-500" />;
      case 'impressions':
        return <Share2 className="w-4 h-4 text-blue-500" />;
      case 'likes':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'comments':
        return <MessageCircle className="w-4 h-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const formatMetricValue = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getDateRangeFilter = (date: string, range: string) => {
    try {
      const postDate = new Date(date);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24));

      switch (range) {
        case 'today':
          return daysDiff < 1;
        case 'week':
          return daysDiff <= 7;
        case 'month':
          return daysDiff <= 30;
        default:
          return true;
      }
    } catch (error) {
      return true;
    }
  };

  const getPerformanceFilter = (post: Post) => {
    if (!post.engagement || !post.reach) return true;
    const engagementRate = post.engagement / post.reach * 100;
    
    switch (performanceFilter) {
      case 'high':
        return engagementRate > 5;
      case 'medium':
        return engagementRate >= 2 && engagementRate <= 5;
      case 'low':
        return engagementRate < 2;
      default:
        return true;
    }
  };

  const sortedAndFilteredPosts = React.useMemo(() => {
    let filteredPosts = [...posts];
    
    if (searchQuery) {
      filteredPosts = filteredPosts.filter(post => 
        post.caption?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterPlatform !== 'all') {
      filteredPosts = filteredPosts.filter(post => 
        post.platform?.toLowerCase() === filterPlatform.toLowerCase()
      );
    }

    if (dateRange !== 'all') {
      filteredPosts = filteredPosts.filter(post => 
        getDateRangeFilter(post.createdAt, dateRange)
      );
    }

    if (performanceFilter !== 'all') {
      filteredPosts = filteredPosts.filter(getPerformanceFilter);
    }

    return filteredPosts.sort((a, b) => {
      const valueA = getMetricValue(a, sortConfig.key);
      const valueB = getMetricValue(b, sortConfig.key);
      
      if (sortConfig.direction === 'asc') {
        return valueA - valueB;
      }
      return valueB - valueA;
    });
  }, [posts, sortConfig, filterPlatform, searchQuery, dateRange, performanceFilter]);
  const uniquePlatforms = Array.from(new Set(posts.filter(post => post.platform).map(post => post.platform)));

  if (!posts || posts.length === 0) {
    return (
      <div className="mt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Posts Performance</h3>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No posts data available for the selected period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Posts Performance</h3>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Platforms</option>
              {uniquePlatforms.map(platform => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>
            <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>

          <select
            value={performanceFilter}
            onChange={(e) => setPerformanceFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Performance</option>
            <option value="high">High Engagement (5%)</option>
            <option value="medium">Medium Engagement (2-5%)</option>
            <option value="low">Low Engagement (2%)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Post
                </th>
                {['engagement', 'reach', 'impressions', 'likes', 'comments', 'shares'].map(metricKey => (
                  <th
                    key={metricKey}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(metricKey)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{metricKey}</span>
                      {sortConfig.key === metricKey && (
                        sortConfig.direction === 'desc' ? 
                          <ArrowDown className="w-4 h-4" /> : 
                          <ArrowUp className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAndFilteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                          {getPlatformIcon(post.platform)}
                          <span className="ml-1">{post.platform}</span>
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 line-clamp-2">{post.caption}</p>
                    </div>
                  </td>
                  {['engagement', 'reach', 'impressions', 'likes', 'comments', 'shares'].map(metricKey => (
                    <td key={metricKey} className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getMetricIcon(metricKey)}
                        <span className="text-sm font-medium text-gray-900">
                          {formatMetricValue(getMetricValue(post, metricKey))}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500 text-right">
        Showing {sortedAndFilteredPosts.length} of {posts.length} posts
      </div>
    </div>
  );
}
