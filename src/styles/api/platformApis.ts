import type { Post, Platform, PostType, PlatformSettings } from '../../types/posts';
import type { MediaFile } from '../../types/media';
import { APP_URL } from '../../config/api';

export interface PostRequest {
  caption: string;
  mediaFiles?: MediaFile[];
  settings?: PlatformSettings;
  scheduledDate?: string;
  scheduledTime?: string;
  hashtags?: string;
  postType: PostType;
}

class PlatformAPI {
  private token: string | null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    if (!this.token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${APP_URL}/api${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  // Twitter-specific methods
  async postToTwitter(data: PostRequest) {
    return this.request('/twitter/post', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async postTwitterThread(threadPosts: PostRequest[]) {
    return this.request('/twitter/thread', {
      method: 'POST',
      body: JSON.stringify({ posts: threadPosts }),
    });
  }

  // Instagram-specific methods
  async postToInstagram(data: PostRequest) {
    return this.request('/instagram/post', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async postInstagramStory(data: PostRequest) {
    return this.request('/instagram/story', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async postInstagramReel(data: PostRequest) {
    return this.request('/instagram/reel', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Facebook-specific methods
  async postToFacebook(data: PostRequest) {
    return this.request('/facebook/post', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async postFacebookStory(data: PostRequest) {
    return this.request('/facebook/story', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // LinkedIn-specific methods
  async postToLinkedIn(data: PostRequest) {
    return this.request('/linkedin/post', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async postLinkedInArticle(data: PostRequest) {
    return this.request('/linkedin/article', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // TikTok-specific methods
  async postToTikTok(data: PostRequest) {
    return this.request('/tiktok/post', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Generic post creation
  async createPost(post: Post) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  }

  // Update existing post
  async updatePost(postId: string, post: Partial<Post>) {
    return this.request(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(post),
    });
  }

  // Delete post
  async deletePost(postId: string) {
    return this.request(`/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  // Retry failed post
  async retryPost(postId: string) {
    return this.request(`/posts/${postId}/retry`, {
      method: 'POST',
    });
  }
}
export const platformApi = new PlatformAPI();