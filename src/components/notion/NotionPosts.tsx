import React, { useState, useEffect, useCallback } from 'react';
import { notionService } from '../../services/notion/notionService';
import { NotionPost, PostStatus, SocialPlatform } from '../../types/notion';
import { Calendar, Clock, Globe, Twitter, Linkedin, Facebook, Instagram, Filter, Search, AlertCircle } from 'lucide-react';

interface NotionPostsProps {
  databaseId: string;
  onError: (error: string) => void;
}

export function NotionPosts({ databaseId, onError }: NotionPostsProps) {
  const [posts, setPosts] = useState<NotionPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedPosts = await notionService.fetchPosts();
      setPosts(fetchedPosts);
    } catch (error: any) {
      onError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    fetchPosts();
  }, [databaseId, fetchPosts]);

  const handleStatusChange = async (postId: string, newStatus: PostStatus) => {
    try {
      await notionService.updatePostStatus(postId, newStatus);
      await fetchPosts();
    } catch (error: any) {
      onError(error.message);
    }
  };

  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case PostStatus.PUBLISHED:
        return 'bg-green-100 text-green-800 border-green-200';
      case PostStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPlatformIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case SocialPlatform.TWITTER:
        return <Twitter className="w-5 h-5 text-blue-400" />;
      case SocialPlatform.LINKEDIN:
        return <Linkedin className="w-5 h-5 text-blue-700" />;
      case SocialPlatform.FACEBOOK:
        return <Facebook className="w-5 h-5 text-blue-600" />;
      case SocialPlatform.INSTAGRAM:
        return <Instagram className="w-5 h-5 text-pink-600" />;
      default:
        return <Globe className="w-5 h-5 text-gray-400" />;
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading your posts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PostStatus | 'all')}
              className="appearance-none pl-8 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              {Object.values(PostStatus).map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No posts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filter settings'
                : 'Start by creating your first post in Notion'}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {post.title}
                    </h3>
                    <p className="mt-1 text-gray-600 line-clamp-2">{post.content}</p>
                    
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <div className="flex items-center space-x-1">
                        {post.platforms.map((platform) => (
                          <span key={platform} className="inline-block">
                            {getPlatformIcon(platform as SocialPlatform)}
                          </span>
                        ))}
                      </div>
                      
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(post.status)}`}>
                        {post.status}
                      </span>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{new Date(post.scheduledTime).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{new Date(post.scheduledTime).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    <select
                      value={post.status}
                      onChange={(e) => post.id && handleStatusChange(post.id, e.target.value as PostStatus)}
                      className={`block w-full px-3 py-2 text-sm border rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 ${
                        post.status === PostStatus.PUBLISHED
                          ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                          : post.status === PostStatus.SCHEDULED
                          ? 'border-blue-300 focus:ring-blue-500 focus:border-blue-500'
                          : 'border-gray-300 focus:ring-gray-500 focus:border-gray-500'
                      }`}
                    >
                      {Object.values(PostStatus).map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {post.images && post.images.length > 0 && (
                  <div className="mt-4 flex space-x-2 overflow-x-auto">
                    {post.images.map((imageUrl, index) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt={`Post image ${index + 1}`}
                        className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 