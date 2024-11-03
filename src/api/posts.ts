import { Post, MediaFile } from '../types/posts';

const API_BASE_URL = 'http://localhost:5000/api';

export async function createPost(formData: FormData): Promise<Post> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token');

  // Convert FormData to JSON for proper API handling
  const jsonData = {
    caption: formData.get('caption'),
    scheduledDate: formData.get('scheduledDate'),
    platform: formData.get('platform'),
    hashtags: formData.get('hashtags'),
    visibility: formData.get('visibility'),
    mediaFiles: formData.get('mediaFiles'),
    publishNow: formData.get('publishNow') === 'true'
  };

  try {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jsonData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create post');
    }

    return data;
  } catch (error) {
    console.error('Create post error:', error);
    throw error instanceof Error ? error : new Error('Failed to create post');
  }
}

export async function uploadMedia(file: FormData): Promise<MediaFile> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token');

  const response = await fetch(`${API_BASE_URL}/media/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: file
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload media');
  }

  return response.json();
}

export async function getScheduledPosts(): Promise<Post[]> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token');

  const response = await fetch(`${API_BASE_URL}/posts/scheduled`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch scheduled posts');
  }

  return response.json();
}

export async function deletePost(postId: string): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token');

  const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete post');
  }
}

export async function updatePost(postId: string, postData: FormData): Promise<Post> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token');

  const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: postData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update post');
  }

  return response.json();
}