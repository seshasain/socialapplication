import { useState, useCallback } from 'react';
import { postingService } from '../styles/api/postingService';
import type { Post, PostFormData, PostValidationError } from '../types/posts';

interface UsePostCreationReturn {
  createPost: (data: PostFormData) => Promise<Post>;
  isCreating: boolean;
  validationErrors: PostValidationError[];
  error: Error | null;
}

export function usePostCreation(): UsePostCreationReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<PostValidationError[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const createPost = useCallback(async (formData: PostFormData): Promise<Post> => {
    try {
      setIsCreating(true);
      setError(null);
      setValidationErrors([]);

      // Validate post for each platform
      const errors = await Promise.all(
        formData.platforms.map(async ({ platform, postType }) => {
          return postingService.validatePost(
            formData.caption,
            [platform],
            postType,
            formData.mediaFiles,
            formData.platforms.find(p => p.platform === platform)?.settings
          );
        })
      );

      const flatErrors = errors.flat();
      if (flatErrors.length > 0) {
        setValidationErrors(flatErrors);
        throw new Error('Validation failed');
      }

      // Create post object
      const post: Post = {
        id: '', // Will be set by backend
        caption: formData.caption,
        scheduledDate: `${formData.scheduledDate}T${formData.scheduledTime}`,
        platforms: formData.platforms.map(p => ({
          id: '', // Will be set by backend
          platform: p.platform,
          status: 'scheduled',
          settings: p.settings,
        })),
        hashtags: formData.hashtags,
        visibility: formData.visibility as 'public' | 'private' | 'draft',
        mediaFiles: formData.mediaFiles,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Handle thread creation if needed
      if (formData.threadContent && formData.threadContent.length > 0) {
        const threadPosts = formData.threadContent.map((content, index) => ({
          content,
          mediaFiles: formData.threadMedia?.[`thread-${index}`] || [],
        }));

        const twitterSettings = formData.platforms
          .find(p => p.platform === 'twitter')
          ?.settings?.twitter;

        if (twitterSettings) {
          await postingService.publishTwitterThread(threadPosts, twitterSettings);
        }
      }

      // Create the post
      const createdPost = await postingService.createPost(post);
      return createdPost;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create post');
      setError(error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return {
    createPost,
    isCreating,
    validationErrors,
    error,
  };
}