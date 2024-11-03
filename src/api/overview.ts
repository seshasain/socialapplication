const API_BASE_URL = 'http://localhost:5000/api';

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
    refreshToken?: string;
  }>;
}

async function getAuthHeaders() {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token');

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

export async function fetchOverviewData(): Promise<OverviewResponse> {
  const headers = await getAuthHeaders();

  const [statsResponse, postsResponse, accountsResponse] = await Promise.all([
    fetch(`${API_BASE_URL}/overview/stats`, { headers }),
    fetch(`${API_BASE_URL}/overview/upcoming-posts`, { headers }),
    fetch(`${API_BASE_URL}/social-accounts`, { headers })
  ]);

  if (!statsResponse.ok || !postsResponse.ok) {
    throw new Error('Failed to fetch data');
  }

  const [stats, posts] = await Promise.all([
    statsResponse.json(),
    postsResponse.json()
  ]);

  const accounts = accountsResponse.ok ? await accountsResponse.json() : [];

  return { stats, posts, accounts };
}

export async function connectSocialAccount(platform: string) {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/social-accounts/connect`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ 
      platform,
      accessToken: 'mock-token', // For demo purposes
      refreshToken: 'mock-refresh',
      username: `demo_${platform}`,
      profileUrl: `https://${platform}.com/demo`
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to connect account');
  }

  return response.json();
}

export async function disconnectSocialAccount(accountId: string) {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/social-accounts/${accountId}`, {
    method: 'DELETE',
    headers
  });

  if (!response.ok) {
    throw new Error('Failed to disconnect account');
  }
}