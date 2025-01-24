import axios from 'axios';

const isDevelopment = import.meta.env.MODE === 'development';
const API_URL = isDevelopment 
  ? 'http://localhost:5000'
  : 'https://crosspodium-api-katv4u7upa-uc.a.run.app';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, // 10 seconds
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

interface LoginData {
  email: string;
  password: string;
}

interface SignupData {
  email: string;
  password: string;
  name: string;
  redirectUrl?: string | null;
  captchaToken?: string;
}

// Auth endpoints
export const auth = {
  login: (data: LoginData) => 
    api.post('/api/auth/login', data),
  signup: (data: SignupData) => 
    api.post('/api/auth/signup', data),
  me: () => api.get('/api/auth/me'),
};

// Posts endpoints
export const posts = {
  create: (data: any) => api.post('/api/posts', data),
  list: (params?: any) => api.get('/api/posts', { params }),
  get: (id: string) => api.get(`/api/posts/${id}`),
  update: (id: string, data: any) => api.put(`/api/posts/${id}`, data),
  delete: (id: string) => api.delete(`/api/posts/${id}`),
};

// Social accounts endpoints
export const socialAccounts = {
  list: () => api.get('/api/social-accounts'),
  connect: (platform: string) => api.post('/api/social-accounts/connect', { platform }),
  disconnect: (id: string) => api.delete(`/api/social-accounts/${id}`),
};

// Analytics endpoints
export const analytics = {
  overview: (params?: any) => api.get('/api/analytics/overview', { params }),
  stats: () => api.get('/api/overview/stats'),
}; 