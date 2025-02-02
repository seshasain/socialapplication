// Determine if we're in development mode
const isDevelopment = import.meta.env.MODE === 'development';

// Set the API URL based on environment
export const API_URL = isDevelopment 
  ? 'http://localhost:5000'
  : 'https://crosspodium-api-katv4u7upa-uc.a.run.app';

// API configuration
export const API_CONFIG = {
  timeout: 60000, // 60 seconds
  retryAttempts: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Define all API routes
export const API_ROUTES = {
  auth: {
    login: '/api/auth/login',
    signup: '/api/auth/signup',
    me: '/api/auth/me',
    deactivate: '/api/auth/deactivate',
    reactivate: '/api/auth/reactivate',
    delete: '/api/auth/delete',
  },
  posts: {
    list: '/api/posts',
    history: '/api/posts/history',
    scheduled: '/api/posts/scheduled',
    overview: '/api/posts/overview',
    calendar: '/api/posts/calendar',
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
    usage: '/api/user/usage',
    password: '/api/auth/password',
  },
  integrations: {
    sources: '/api/integrations/sources',
    stats: '/api/integrations/stats',
    sync: (sourceId: string) => `/api/integrations/sync/${sourceId}`,
    source: (id: string) => `/api/integrations/sources/${id}`,
  },
} as const;