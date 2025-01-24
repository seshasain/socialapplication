import axios from 'axios';
import { API_URL, API_ROUTES } from '../config/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000, // Increase timeout to 30 seconds
  timeoutErrorMessage: 'Server request timed out. Please try again.',
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface CustomError extends Error {
  response?: any;
  status?: number;
}

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Server request timed out. Please try again.');
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Don't redirect here, let the ProtectedRoute handle it
      const customError: CustomError = new Error('Authentication required');
      customError.status = 401;
      customError.response = error.response;
      return Promise.reject(customError);
    }
    
    // For 400 Bad Request, extract the error message
    if (error.response?.status === 400) {
      const errorMessage = error.response.data?.message || 
                          error.response.data?.error || 
                          'Invalid request';
      const customError: CustomError = new Error(errorMessage);
      customError.status = 400;
      customError.response = error.response;
      return Promise.reject(customError);
    }
    
    // For other errors
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'An error occurred';
    
    const customError: CustomError = new Error(errorMessage);
    customError.response = error.response;
    return Promise.reject(customError);
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
  deactivate: (reason?: string) => 
    api.post('/api/auth/deactivate', { reason }),
  reactivate: (data: { email: string; password: string }) => 
    api.post('/api/auth/reactivate', data),
  delete: (password: string) => 
    api.post('/api/auth/delete', { password }),
};

// Posts endpoints
export const posts = {
  create: (data: any) => api.post(API_ROUTES.posts.list, data),
  list: (params?: any) => api.get(API_ROUTES.posts.list, { params }),
  calendar: () => api.get(API_ROUTES.posts.calendar),
  get: (id: string) => api.get(`${API_ROUTES.posts.list}/${id}`),
  update: (id: string, data: any) => api.put(`${API_ROUTES.posts.list}/${id}`, data),
  delete: (id: string) => api.delete(`${API_ROUTES.posts.list}/${id}`),
  history: (params?: any) => api.get(API_ROUTES.posts.history, { params }),
  scheduled: () => api.get(API_ROUTES.posts.scheduled),
  retry: (id: string) => api.post(API_ROUTES.posts.retry(id)),
  status: (id: string) => api.get(API_ROUTES.posts.status(id)),
};

// Social accounts endpoints
export const socialAccounts = {
  list: () => api.get(API_ROUTES.socialAccounts.list),
  connect: (platform: string) => api.post(API_ROUTES.socialAccounts.connect, { platform }),
  disconnect: (id: string) => api.delete(API_ROUTES.socialAccounts.disconnect(id)),
};

// Analytics endpoints
export const analytics = {
  overview: (params?: any) => api.get(API_ROUTES.analytics.overview, { params }),
  stats: () => api.get(API_ROUTES.analytics.stats),
};

export const team = {
  list: () => api.get(API_ROUTES.team),
};

export const user = {
  getProfile: () => api.get(API_ROUTES.user.profile),
  updateProfile: (data: any) => api.put(API_ROUTES.user.profile, data),
  updateSettings: (data: any) => api.put(API_ROUTES.user.settings, data),
  updatePassword: (data: { currentPassword: string; newPassword: string }) => 
    api.post(API_ROUTES.user.password, data),
}; 