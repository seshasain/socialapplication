import React from 'react';
import { Eye, Heart, MessageCircle, Share2, TrendingUp } from 'lucide-react';

interface Post {
  id: string;
  caption: string;
  platform: string;
  engagement: number;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  date: string;
}

interface PostsListProps {
  posts: Post[];
  metric: string;
}

export default function PostsList({ posts, metric }: PostsListProps) {
  const getMetricValue = (post: Post, metric: string) => {
    switch (metric) {
      case 'engagement':
        return post.engagement;
      case 'reach':
        return post.reach;
      case 'impressions':
        return post.impressions;
      default:
        return 0;
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'engagement':
        return <TrendingUp className="w-4 h-4 text-indigo-500" />;
      case 'reach':
        return <Eye className="w-4 h-4 text-green-500" />;
      case 'impressions':
        return <Share2 className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No posts found for the selected filters
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Posts Performance</h3>
      <div className="grid gap-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {post.platform}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  {new Date(post.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-sm font-medium">
                {getMetricIcon(metric)}
                <span className="text-gray-900">
                  {getMetricValue(post, metric).toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-gray-900 mb-3 line-clamp-2">{post.caption}</p>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Heart className="w-4 h-4 text-red-500 mr-1" />
                <span>{post.likes.toLocaleString()}</span>
              </div>
              <div className="flex items-center">
                <MessageCircle className="w-4 h-4 text-blue-500 mr-1" />
                <span>{post.comments.toLocaleString()}</span>
              </div>
              <div className="flex items-center">
                <Share2 className="w-4 h-4 text-green-500 mr-1" />
                <span>{post.shares.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}