import React, { useState, useEffect, useCallback } from 'react';
import { notionService } from '../../services/notion/notionService';
import { NotionPost, PostStatus, SocialPlatform } from '../../types/notion';

interface NotionPostsProps {
  databaseId: string;
  onError: (error: string) => void;
}

export function NotionPosts({ databaseId, onError }: NotionPostsProps) {
  const [posts, setPosts] = useState<NotionPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
      await fetchPosts(); // Refresh the posts list
    } catch (error: any) {
      onError(error.message);
    }
  };

  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case PostStatus.PUBLISHED:
        return 'bg-green-100 text-green-800';
      case PostStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case SocialPlatform.TWITTER:
        return '🐦';
      case SocialPlatform.LINKEDIN:
        return '💼';
      case SocialPlatform.FACEBOOK:
        return '👍';
      case SocialPlatform.INSTAGRAM:
        return '📸';
      default:
        return '🌐';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Notion Posts</h2>
        <button
          onClick={fetchPosts}
          disabled={isLoading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Posts'}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{post.title}</h3>
                  <p className="mt-2 text-gray-600">{post.content}</p>
                  
                  <div className="mt-4 flex items-center space-x-4">
                    <div className="flex space-x-2">
                      {post.platforms.map((platform) => (
                        <span key={platform} className="text-2xl" title={platform}>
                          {getPlatformIcon(platform as SocialPlatform)}
                        </span>
                      ))}
                    </div>
                    
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(post.status)}`}>
                      {post.status}
                    </span>
                    
                    <span className="text-sm text-gray-500">
                      Scheduled: {new Date(post.scheduledTime).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="ml-4">
                  <select
                    value={post.status}
                    onChange={(e) => post.id && handleStatusChange(post.id, e.target.value as PostStatus)}
                    className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {Object.values(PostStatus).map((status) => (
                      <option key={status} value={status}>
                        {status}
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
                      className="h-20 w-20 object-cover rounded-md"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {posts.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No posts found in this database</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 