import axios from 'axios';
import { API_URL, API_ROUTES } from '../config/api';

// Create axios instance with retry configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 60000, // Increase timeout to 60 seconds
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

// Handle response errors with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config } = error;
    
    // Only retry on network errors or timeouts
    if (!error.response || error.code === 'ECONNABORTED') {
      config.retryCount = (config.retryCount || 0) + 1;
      
      if (config.retryCount <= 3) {
        // Wait 1s before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return api(config);
      }
    }
    
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
  login: async (data: LoginData) => {
    console.log('Login request:', { url: API_ROUTES.auth.login, data });
    try {
      // Configure retry logic for login
      const maxRetries = 3;
      const retryDelay = 1000; // 1 second
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          const response = await api.post(API_ROUTES.auth.login, data, {
            timeout: 10000, // Shorter timeout for login
          });
          console.log('Login response:', response.data);
          return response;
        } catch (error: any) {
          if (error.code === 'ECONNABORTED' && retryCount < maxRetries - 1) {
            console.log(`Login attempt ${retryCount + 1} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retryCount++;
            continue;
          }
          throw error;
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  signup: (data: SignupData) => api.post(API_ROUTES.auth.signup, data),
  me: () => api.get(API_ROUTES.auth.me),
  deactivate: (reason?: string) => api.post(API_ROUTES.auth.deactivate, { reason }),
  reactivate: (data: { email: string; password: string }) => api.post(API_ROUTES.auth.reactivate, data),
  delete: (password: string) => api.post(API_ROUTES.auth.delete, { password }),
  startTrial: () => api.post('/api/auth/start-trial'),
  extendTrial: (days: number) => api.post('/api/auth/extend-trial', { days }),
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
  list: () => api.get('/api/social-accounts'),
  connect: (platform: string) => api.get('/api/social-accounts/connect', { params: { platform } }),
  disconnect: (accountId: string) => api.delete(`/api/social-accounts/${accountId}`)
};

// Analytics endpoints
export const analytics = {
  stats: () => api.get('/api/analytics/stats'),
  overview: (params: { type: 'upcoming' | 'history' }) => api.get('/api/analytics/overview', { params })
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

// Add new endpoints for trial management
export const subscription = {
  checkTrialEligibility: () => api.get('/api/subscription/trial-eligibility'),
  convertTrial: (planId: string) => api.post('/api/subscription/convert-trial', { planId }),
  getTrialStatus: () => api.get('/api/subscription/trial/status'),
  getTrialUsage: () => api.get('/api/subscription/trial/usage'),
  getLastExtensionRequest: () => api.get('/api/subscription/trial/extension-request'),
  getReferralInfo: () => api.get('/api/subscription/trial/referral'),
  requestExtension: (days: number, reason: string) => 
    api.post('/api/subscription/trial/extend', { days, reason }),
  updatePaymentMethod: (paymentMethodId: string) => 
    api.put('/api/subscription/payment-method', { paymentMethodId }),
  cancelSubscription: () => api.post('/api/subscription/cancel'),
  reactivateSubscription: () => api.post('/api/subscription/reactivate')
}; 