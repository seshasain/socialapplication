import type { Post, PostFormData } from '../types/posts';
import type { MediaFile, MediaType, UploadResponse } from '../types/media';
import { posts } from '../utils/api';
import { validateFile } from '../utils/fileValidation';
import { API_URL } from '../config/api';
import { APIError, MediaUploadError, AuthenticationError, ValidationError } from '../types/errors';

function validatePostData(data: any): data is Post {
  if (!data || typeof data !== 'object') return false;
  return (
    typeof data.id === 'string' &&
    typeof data.caption === 'string' &&
    Array.isArray(data.mediaFiles) &&
    Array.isArray(data.platforms) &&
    typeof data.status === 'string'
  );
}

function validateUploadResponse(data: any): data is UploadResponse {
  if (!data || typeof data !== 'object') return false;
  return (
    typeof data.id === 'string' &&
    typeof data.url === 'string' &&
    typeof data.filename === 'string' &&
    typeof data.size === 'number'
  );
}

export async function getPostHistory(
  filter = 'all',
  sortBy = 'date',
  order = 'desc'
): Promise<Post[]> {
  try {
    const response = await posts.list({ filter, sortBy, order });
    if (!Array.isArray(response.data)) {
      throw new APIError('Invalid response format', 500);
    }
    if (!response.data.every(validatePostData)) {
      throw new APIError('Invalid post data in response', 500);
    }
    return response.data;
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error('Fetch post history error:', error);
    throw new APIError('Failed to fetch post history', 500);
  }
}

export async function getScheduledPosts(): Promise<Post[]> {
  try {
    const response = await posts.list({ status: 'scheduled' });
    if (!Array.isArray(response.data)) {
      throw new APIError('Invalid response format', 500);
    }
    if (!response.data.every(validatePostData)) {
      throw new APIError('Invalid post data in response', 500);
    }
    return response.data;
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error('Fetch scheduled posts error:', error);
    throw new APIError('Failed to fetch scheduled posts', 500);
  }
}

export const uploadMedia = async (file: File | MediaFile): Promise<MediaFile> => {
  if (!file) {
    throw new ValidationError('No file provided');
  }

  try {
    if ('url' in file) return file;

    const token = localStorage.getItem('token');
    if (!token) {
      throw new AuthenticationError();
    }

    validateFile(file);

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/media/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new MediaUploadError(
        errorData.error || `Upload failed with status: ${response.status}`,
        file.name,
        response.status
      );
    }

    const data = await response.json();
    if (!validateUploadResponse(data)) {
      throw new APIError('Invalid response from server', 500);
    }

    const mediaFile: MediaFile = {
      id: data.id,
      url: data.url.startsWith('http') ? data.url : `${API_URL}/uploads/${data.filename}`,
      type: (data.type || file.type).includes('video') ? 'video' : 'image',
      filename: data.filename,
      size: data.size || file.size,
      status: 'success'
    };

    if (data.s3Key) mediaFile.s3Key = data.s3Key;
    if (data.userId) mediaFile.userId = data.userId;
    if (data.createdAt) mediaFile.createdAt = data.createdAt;
    if (data.updatedAt) mediaFile.updatedAt = data.updatedAt;

    return mediaFile;

  } catch (error) {
    if (error instanceof APIError) throw error;
    if (error instanceof ValidationError) throw error;
    console.error('Upload error:', error);
    throw new MediaUploadError(
      'Failed to upload media file',
      file instanceof File ? file.name : 'unknown'
    );
  }
};

export const createPost = async (postData: PostFormData): Promise<Post> => {
  try {
    if (!postData.caption) {
      throw new ValidationError('Caption is required', 'caption');
    }
    if (!Array.isArray(postData.platforms) || postData.platforms.length === 0) {
      throw new ValidationError('At least one platform must be selected', 'platforms');
    }

    const response = await posts.create(postData);
    if (!validatePostData(response.data)) {
      throw new APIError('Invalid response from server', 500);
    }
    return response.data;
  } catch (error) {
    if (error instanceof APIError) throw error;
    if (error instanceof ValidationError) throw error;
    console.error('Create post error:', error);
    throw new APIError('Failed to create post', 500);
  }
};

export async function deletePost(postId: string): Promise<void> {
  if (!postId) {
    throw new ValidationError('Post ID is required', 'postId');
  }

  try {
    await posts.delete(postId);
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error('Delete post error:', error);
    throw new APIError('Failed to delete post', 500);
  }
}

export async function getPosts(): Promise<Post[]> {
  try {
    const response = await posts.list();
    if (!Array.isArray(response.data)) {
      throw new APIError('Invalid response format', 500);
    }
    if (!response.data.every(validatePostData)) {
      throw new APIError('Invalid post data in response', 500);
    }
    return response.data;
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error('Fetch posts error:', error);
    throw new APIError('Failed to fetch posts', 500);
  }
}