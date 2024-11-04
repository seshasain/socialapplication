import { Post, MediaFile, PostFormData} from '../types/posts';
  
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


export async function createPost(data: PostFormData): Promise<Post> {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token');

    // Transform the data to match the schema
    const requestBody = {
      caption: data.caption,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate).toISOString() : new Date().toISOString(),
      hashtags: data.hashtags || '',
      visibility: data.visibility || 'public',
      mediaFiles: data.mediaFiles?.length ? {
        connect: data.mediaFiles.map(file => ({ id: file.id }))
      } : undefined,
      platforms: {
        create: data.selectedPlatforms?.map(platform => ({
          platform,
          status: data.publishNow ? 'publishing' : 'scheduled',
          settings: {}
        })) || []
      }
    };

    const response = await fetch(`${API_BASE_URL}/post`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create post');
    }

    return response.json();
  } catch (error) {
    console.error('Create post error:', error);
    throw error;
  }
}
export async function getAnalytics(dateRange: string = '7d') {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token');

    const response = await fetch(`${API_BASE_URL}/analytics/overview`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }

    return await response.json();
  } catch (error) {
    console.error('Analytics error:', error);
    throw error;
  }
}
export async function uploadMedia(formData: FormData) {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token');

    const response = await fetch(`${API_BASE_URL}/media/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload media');
    }

    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
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
export async function getPosts() {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token');

    const response = await fetch(`${API_BASE_URL}/posts`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch posts error:', error);
    throw error;
  }
}
