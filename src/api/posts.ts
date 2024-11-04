import { Post, MediaFile } from '../types/posts';
  
const API_BASE_URL = 'http://localhost:5000/api';

export async function getPostHistory(filter = 'all', sortBy = 'date', order = 'desc'): Promise<Post[]> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token');

  const response = await fetch(
    `${API_BASE_URL}/posts/history?filter=${filter}&sortBy=${sortBy}&order=${order}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch post history');
  }

  return response.json();
}

export async function createPost(postData: any): Promise<Post> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token');

  try {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create post');
    }

    return response.json();
  } catch (error) {
    console.error('Create post error:', error);
    throw error instanceof Error ? error : new Error('Failed to create post');
  }
}

export async function uploadMedia(file: File): Promise<MediaFile> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token');

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/media/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
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

// Add these functions to your existing posts.ts file

export async function duplicatePost(postId: string): Promise<Post> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token');

  const response = await fetch(`${API_BASE_URL}/posts/${postId}/duplicate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to duplicate post');
  }

  return response.json();
}