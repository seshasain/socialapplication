import { Post, MediaFile, PostFormData } from '../types/posts';
import { APP_URL } from '../config/api';
import { validateFile } from '../utils/fileValidation';

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

export const uploadMedia = async (file: File | MediaFile): Promise<MediaFile> => {
  if (!file) {
    throw new Error('No file provided');
  }

  try {
    // If it's already a MediaFile, return it directly
    if ('url' in file) {
      return file;
    }

    console.log('Starting file upload:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });

    // Validate file before upload
    validateFile(file);

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${APP_URL}/api/media/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || `Upload failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Upload response:', data);

    if (!data || !data.url || !data.id) {
      console.error('Invalid server response:', data);
      throw new Error('Invalid response from server');
    }

    // Ensure the response matches the MediaFile type
    const mediaFile: MediaFile = {
      id: data.id,
      userId: data.userId,
      url: data.url.startsWith('http') ? data.url : `${APP_URL}/uploads/${data.filename}`,
      type: data.type || file.type, // Use original file type if server doesn't provide one
      filename: data.filename,
      size: data.size || file.size,
      s3Key: data.s3Key,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
    };

    console.log('Processed media file:', mediaFile);
    return mediaFile;

  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

export const createPost = async (postData: any): Promise<any> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${APP_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create post');
    }

    return await response.json();
  } catch (error) {
    console.error('Create post error:', error);
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