// Determine if we're in development mode
const isDevelopment = import.meta.env.MODE === 'development';

// Set the API URL based on environment
export const API_URL = isDevelopment 
  ? 'http://localhost:5000'
  : 'https://crosspodium-api-katv4u7upa-uc.a.run.app';

// Define all API routes
export const API_ROUTES = {
  posts: {
    list: '/api/posts',
    history: '/api/posts/history',
    scheduled: '/api/posts/scheduled',
    overview: '/api/posts/overview',
    retry: (id: string) => `/api/posts/retry/${id}`,
    status: (id: string) => `/api/posts/status/${id}`,
  },
  socialAccounts: {
    list: '/api/social-accounts',
    connect: '/api/social-accounts/connect',
    disconnect: (id: string) => `/api/social-accounts/${id}`,
  },
  analytics: {
    overview: '/api/analytics/overview',
    stats: '/api/analytics/stats',
  },
  overview: {
    stats: '/api/overview/stats',
  },
  team: '/api/team',
  user: {
    profile: '/api/user/profile',
    settings: '/api/user/settings',
    password: '/api/auth/password',
  },
} as const;