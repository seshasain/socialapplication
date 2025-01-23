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
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to connect account');
  }
}

export async function disconnectSocialAccount(accountId: string) {
  try {
    await socialAccounts.disconnect(accountId);
  } catch (error) {
    throw new Error('Failed to disconnect account');
  }
}