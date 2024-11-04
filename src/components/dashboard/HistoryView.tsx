import React, { useState, useEffect } from 'react';
import {
  Calendar, Instagram, Facebook, Twitter, Linkedin, Youtube, Search, Filter,
  ArrowUp, ArrowDown, Eye, Heart, MessageCircle, Share2, Loader2,
  MoreHorizontal, Edit2, RefreshCw, Calendar as CalendarIcon,
  AlertTriangle, Send, Trash2
} from 'lucide-react';
import { toRelative } from '../../utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import NewPostModal from '../modals/NewPostModal';
import type { Post, PostPlatform } from '../../types/posts';

// Define available platforms statically since we can't fetch them
const AVAILABLE_PLATFORMS = [
  { platform: 'instagram', id: 'instagram' },
  { platform: 'facebook', id: 'facebook' },
  { platform: 'twitter', id: 'twitter' },
  { platform: 'linkedin', id: 'linkedin' },
  { platform: 'youtube', id: 'youtube' }
];

export default function HistoryView() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('7d');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [filter, sortBy, sortOrder, dateRange]);

  const filteredPosts = posts.filter(post => {
    if (searchQuery) {
      return post.caption.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });   

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(
        `http://localhost:5000/api/posts/history?filter=${filter}&sortBy=${sortBy}&order=${sortOrder}&dateRange=${dateRange}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      // Ensure each post has a platforms array
      const normalizedPosts = data.map((post: Post) => ({
        ...post,
        platforms: post.platforms || []
      }));
      setPosts(normalizedPosts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchPosts();
  };

  const handleSaveEdit = async (updatedPost: Post) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`http://localhost:5000/api/posts/${editingPost?.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedPost)
      });

      if (!response.ok) {
        throw new Error('Failed to update post');
      }

      const updated = await response.json();
      setPosts(posts => posts.map(post =>
        post.id === updated.id ? { ...updated, platforms: updated.platforms || [] } : post
      ));
      setIsEditModalOpen(false);
      setEditingPost(null);
      fetchPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.status === 'published') {
        setError('Published posts cannot be deleted');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      setPosts(posts => posts.filter(post => post.id !== postId));
      setSelectedPost(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    }
  };

  const handleRetryPost = async (postId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`http://localhost:5000/api/posts/retry/${postId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to retry post');
      }

      fetchPosts();
      setSelectedPost(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry post');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-600" />;
      case 'facebook':
        return <Facebook className="w-5 h-5 text-blue-600" />;
      case 'twitter':
        return <Twitter className="w-5 h-5 text-sky-600" />;
      case 'linkedin':
        return <Linkedin className="w-5 h-5 text-blue-700" />;
      case 'youtube':
        return <Youtube className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const renderPostActions = (post: Post) => {
    const actions = [];

    if (post.status === 'scheduled') {
      actions.push(
        <button
          key="edit"
          onClick={() => handleEditPost(post)}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
        >
          <Edit2 className="w-4 h-4 mr-2" /> Edit Post
        </button>
      );
    }

    if (post.status === 'failed') {
      actions.push(
        <button
          key="retry"
          onClick={() => handleRetryPost(post.id)}
          className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center"
        >
          <Send className="w-4 h-4 mr-2" /> Retry Post
        </button>
      );
    }

    if (post.status !== 'published') {
      actions.push(
        <button
          key="delete"
          onClick={() => handleDeletePost(post.id)}
          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
        >
          <Trash2 className="w-4 h-4 mr-2" /> Delete
        </button>
      );
    }

    return actions;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatPostDate = (post: Post) => {
    const publishedPlatform = post.platforms?.find(p => p.publishedAt);
    
    if (post.status === 'published' && publishedPlatform?.publishedAt) {
      return (
        <span className="flex items-center text-gray-500">
          <CalendarIcon className="w-4 h-4 mr-1" />
          Posted {toRelative(publishedPlatform.publishedAt)}
        </span>
      );
    } else {
      const scheduledDate = new Date(post.scheduledDate);
      const isUpcoming = scheduledDate > new Date();
      return (
        <span className="flex items-center text-gray-500">
          <CalendarIcon className="w-4 h-4 mr-1" />
          {isUpcoming ? (
            `Scheduled for ${scheduledDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}`
          ) : (
            `Was scheduled for ${scheduledDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}`
          )}
        </span>
      );
    }
  };

  const handleEditPost = (post: Post) => {
    if (post.status !== 'scheduled') {
      setError('Only scheduled posts can be edited');
      return;
    }

    setEditingPost(post);
    setIsEditModalOpen(true);
    setSelectedPost(null);
  };

  const renderPlatformBadges = (platforms: PostPlatform[] = []) => {
    return (
      <div className="flex flex-wrap gap-2">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
          >
            {getPlatformIcon(platform.platform)}
            <span>{platform.platform}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">Post History</h2>
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Calendar className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="custom">Custom Range</option>
            </select>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Posts</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="failed">Failed</option>
            </select>

            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Posts Grid/List */}
      <AnimatePresence>
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}>
          {loading ? (
            <div className="col-span-2 flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="col-span-2 bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200"
            >
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
              <p className="text-gray-500">Try adjusting your filters or search query</p>
            </motion.div>
          ) : (
            filteredPosts.map((post) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      {renderPlatformBadges(post.platforms)}
                      <span className={`mt-2 inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(post.status)}`}>
                        {post.status}
                      </span>
                    </div>
                    {post.status !== 'published' && (
                      <div className="relative">
                        <button
                          onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreHorizontal className="w-5 h-5 text-gray-600" />
                        </button>
                        {selectedPost === post.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            {renderPostActions(post)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {post.mediaFiles?.length > 0 && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img
                        src={post.mediaFiles[0].url}
                        alt="Post media"
                        className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <p className="text-gray-900 mb-4">{post.caption}</p>

                  <div className="flex items-center space-x-4 text-sm mb-4">
                    {formatPostDate(post)}
                  </div>

                  {post.status === 'published' && (
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <Heart className="w-4 h-4 text-pink-500 mx-auto mb-1" />
                        <span className="text-sm font-medium">{post.likes?.toLocaleString() ?? 0}</span>
                        <p className="text-xs text-gray-500">Likes</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <MessageCircle className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                        <span className="text-sm font-medium">{post.comments?.toLocaleString() ?? 0}</span>
                        <p className="text-xs text-gray-500">Comments</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <Share2 className="w-4 h-4 text-green-500 mx-auto mb-1" />
                        <span className="text-sm font-medium">{post.shares?.toLocaleString() ?? 0}</span>
                        <p className="text-xs text-gray-500">Shares</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <Eye className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                        <span className="text-sm font-medium">{post.engagementRate?.toFixed(1) ?? 0}%</span>
                        <p className="text-xs text-gray-500">Engagement</p>
                      </div>
                    </div>
                  )}

                  {post.status === 'failed' && post.error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      {post.error}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </AnimatePresence>

      {/* Edit Modal */}
      {editingPost && (
        <NewPostModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingPost(null);
          }}
          onSave={handleSaveEdit}
          initialData={editingPost}
          connectedAccounts={AVAILABLE_PLATFORMS}
        />
      )}
    </div>
  );
}