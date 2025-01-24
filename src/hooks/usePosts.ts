import { useState, useCallback, useEffect } from 'react';
import { useApi } from '../context/ApiContext';
import type { Post, PostFormData } from '../types/posts';
import type { MediaFile } from '../types/media';
import api from '../utils/apiClient';
import { ValidationError } from '../types/errors';

interface UsePostsOptions {
  autoLoad?: boolean;
  filter?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

interface PostsState {
  posts: Post[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
}

export function usePosts(options: UsePostsOptions = {}) {
  const { autoLoad = true, filter = 'all', sortBy = 'date', order = 'desc' } = options;
  const [state, setState] = useState<PostsState>({
    posts: [],
    loading: false,
    error: null,
    hasMore: true
  });
  const { request, invalidateCache } = useApi();

  const fetchPosts = useCallback(async () => {
    const cacheKey = `posts-${filter}-${sortBy}-${order}`;
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const posts = await request<Post[]>(
        cacheKey,
        () => api.get('/api/posts', {
          params: { filter, sortBy, order }
        }),
        {
          invalidateOn: ['posts']
        }
      );

      setState(prev => ({
        ...prev,
        posts,
        loading: false,
        hasMore: posts.length >= 20 // Assuming page size of 20
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error
      }));
    }
  }, [filter, sortBy, order, request]);

  const uploadMedia = useCallback(async (file: File): Promise<MediaFile> => {
    if (!file) {
      throw new ValidationError('No file provided', 'file');
    }

    return api.upload('/api/media/upload', file);
  }, []);

  const createPost = useCallback(async (postData: PostFormData): Promise<Post> => {
    if (!postData.caption) {
      throw new ValidationError('Caption is required', 'caption');
    }
    if (!Array.isArray(postData.platforms) || postData.platforms.length === 0) {
      throw new ValidationError('At least one platform must be selected', 'platforms');
    }

    const newPost = await api.post<Post>('/api/posts', postData);
    
    // Optimistically update the cache
    setState(prev => ({
      ...prev,
      posts: [newPost, ...prev.posts]
    }));
    
    invalidateCache(['posts']);
    return newPost;
  }, [invalidateCache]);

  const deletePost = useCallback(async (postId: string): Promise<void> => {
    if (!postId) {
      throw new ValidationError('Post ID is required', 'postId');
    }

    // Optimistically update the UI
    setState(prev => ({
      ...prev,
      posts: prev.posts.filter(post => post.id !== postId)
    }));

    try {
      await api.delete(`/api/posts/${postId}`);
      invalidateCache(['posts']);
    } catch (error) {
      // Revert optimistic update on error
      fetchPosts();
      throw error;
    }
  }, [fetchPosts, invalidateCache]);

  const retryPost = useCallback(async (postId: string, platformId: string): Promise<void> => {
    await api.post(`/api/posts/${postId}/platforms/${platformId}/retry`);
    invalidateCache(['posts']);
    await fetchPosts();
  }, [fetchPosts, invalidateCache]);

  useEffect(() => {
    if (autoLoad) {
      fetchPosts();
    }
  }, [autoLoad, fetchPosts]);

  return {
    ...state,
    fetchPosts,
    uploadMedia,
    createPost,
    deletePost,
    retryPost
  };
} 