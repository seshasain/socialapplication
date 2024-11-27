import { Post, MediaFile, PostFormData } from '../types/posts';
import { APP_URL } from '../config/api';

export async function getPostHistory(
  filter = 'all',
  sortBy = 'date',
  order = 'desc'
): Promise<Post[]> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token');

  const response = await fetch(
    `${APP_URL}/posts/history?filter=${filter}&sortBy=${sortBy}&order=${order}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to fetch post history');
  }

  return response.json();
}

export async function getScheduledPosts(): Promise<Post[]> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token');

  const response = await fetch(`${APP_URL}/posts/scheduled`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to fetch scheduled posts');
  }

  return response.json();
}

export async function createPost(data: PostFormData): Promise<Post> {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token');

    const requestBody = {
      caption: data.caption,
      scheduledDate: data.scheduledDate && data.scheduledTime
        ? new Date(`${data.scheduledDate}T${data.scheduledTime}`).toISOString()
        : new Date().toISOString(),
      platforms: JSON.stringify(data.selectedPlatforms || []),
      hashtags: data.hashtags || '',
      visibility: data.visibility || 'public',
      mediaFiles: data.mediaFiles?.length
        ? JSON.stringify(data.mediaFiles.map(file => file.id))
        : null,
      publishNow: data.publishNow || false
    };

    const response = await fetch(`${APP_URL}/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || 'Failed to create post');
    }

    return response.json();
  } catch (error) {
    console.error('Create post error:', error);
    throw error;
  }
}

export const uploadMedia = async (file: File): Promise<MediaFile> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${APP_URL}/api/media/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(typeof errorData.error === 'string' ? errorData.error : 'Upload failed');
    }

    const data = await response.json();
    if (!data.url || !data.id) {
      throw new Error('Invalid response from server');
    }

    return {
      ...data,
      url: data.url.startsWith('http') ? data.url : `/uploads/${data.filename}`
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

export async function deletePost(postId: string): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token');

  const response = await fetch(`${APP_URL}/posts/${postId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to delete post');
  }
}

export async function getPosts() {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token');

    const response = await fetch(`${APP_URL}/posts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to fetch posts');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch posts error:', error);
    throw error;
  }
}