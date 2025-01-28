import api from '../utils/api';
import { analytics, socialAccounts } from '../utils/api';

interface OverviewResponse {
  stats: {
    totalPosts: number;
    engagementRate: number;
    totalFollowers: number;
    scheduledPosts: number;
  };
  posts: Array<{
    id: string;
    title: string;
    platform: string;
    scheduledDate: string;
    caption: string;
    hashtags: string;
    visibility: string;
  }>;
  accounts: Array<{
    id: string;
    platform: string;
    followerCount: number;
    username?: string;
    profileUrl?: string;
    accessToken: string;
    accessSecret?: string;
  }>;
}

export async function fetchOverviewData(): Promise<OverviewResponse> {
  try {
    const [statsResponse, postsResponse, accountsResponse] = await Promise.all([
      analytics.stats(),
      analytics.overview({ type: 'upcoming' }),
      socialAccounts.list()
    ]);

    return {
      stats: statsResponse.data,
      posts: postsResponse.data,
      accounts: accountsResponse.data
    };
  } catch (error) {
    console.error('Failed to fetch overview data:', error);
    throw error;
  }
}

export async function connectSocialAccount(platform: string) {
  try {
    const response = await socialAccounts.connect(platform);
    
    // Get the OAuth URL from the response
    const { authUrl } = response.data;
    
    if (!authUrl) {
      throw new Error('No authentication URL received from server');
    }
    
    // Open the OAuth window
    window.location.href = authUrl;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to connect account');
  }
}

export const disconnectSocialAccount = async (accountId: string) => {
  console.log('Attempting to disconnect account:', accountId);
  try {
    const response = await api.delete(`/api/social-accounts/${accountId}`);
    console.log('Disconnect response:', response.data);
    return response.data;
  } catch (error: unknown) {
    console.error('Disconnect API error:', error);
    if (error && typeof error === 'object' && 'response' in error && 
        error.response && typeof error.response === 'object' && 
        'data' in error.response && error.response.data && 
        typeof error.response.data === 'object' && 
        'error' in error.response.data && 
        typeof error.response.data.error === 'string') {
      console.error('Disconnect error details:', error.response.data);
      throw new Error(error.response.data.error);
    }
    throw new Error('Failed to disconnect account');
  }
};