import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_URL } from '../config/api';
import {
  APIError,
  AuthenticationError,
  NetworkError,
  RateLimitError,
  NotFoundError,
  createError
} from '../types/errors';

const RETRY_DELAY = 1000;
const MAX_RETRIES = 3;

interface RetryConfig extends Omit<AxiosRequestConfig, 'retry'> {
  retry?: boolean;
  retryCount?: number;
  retryDelay?: number;
  maxRetries?: number;
}

export class APIClient {
  private client: AxiosInstance;
  private retryQueue: Map<string, Promise<any>>;

  constructor(baseURL: string = API_URL) {
    this.client = axios.create({
      baseURL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.retryQueue = new Map();

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(createError(error))
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as RetryConfig;
        
        // Handle rate limiting
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
          throw new RateLimitError('Rate limit exceeded', retryAfter);
        }

        // Handle authentication errors
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          throw new AuthenticationError();
        }

        // Handle not found errors
        if (error.response?.status === 404) {
          throw new NotFoundError();
        }

        // Handle network errors and timeouts
        if (!error.response || error.code === 'ECONNABORTED') {
          // Retry logic for network errors and timeouts
          if (this.shouldRetry(config)) {
            config.retryCount = (config.retryCount || 0) + 1;
            const retryDelay = config.retryDelay || 1000;
            const requestKey = this.getRequestKey(config);
            
            // Check if there's already a retry in progress
            const existingRetry = this.retryQueue.get(requestKey);
            if (existingRetry) return existingRetry;

            const retryPromise = new Promise((resolve) => {
              setTimeout(resolve, retryDelay);
            }).then(() => {
              return this.client(config);
            }).finally(() => {
              this.retryQueue.delete(requestKey);
            });

            this.retryQueue.set(requestKey, retryPromise);
            return retryPromise;
          }
          throw new NetworkError();
        }

        throw createError(error);
      }
    );
  }

  private shouldRetry(config: RetryConfig): boolean {
    if (!config.retry) return false;
    if (!config.retryCount) return true;
    return config.retryCount < (config.maxRetries || 3);
  }

  private getRequestKey(config: RetryConfig): string {
    return `${config.method}-${config.url}-${JSON.stringify(config.params)}-${JSON.stringify(config.data)}`;
  }

  async get<T = any>(url: string, config: RetryConfig = {}): Promise<T> {
    try {
      const { retry, retryCount, retryDelay, maxRetries, ...axiosConfig } = config;
      const response = await this.client.get<T>(url, { 
        ...axiosConfig,
        headers: {
          ...axiosConfig.headers,
          'X-Retry-Count': retryCount?.toString()
        }
      });
      return response.data;
    } catch (error) {
      throw createError(error);
    }
  }

  async post<T = any>(url: string, data?: any, config: RetryConfig = {}): Promise<T> {
    try {
      const { retry = true, retryCount = 0, retryDelay = 1000, maxRetries = 3, ...axiosConfig } = config;
      const response = await this.client.post<T>(url, data, {
        ...axiosConfig,
        retry,
        retryCount,
        retryDelay,
        maxRetries,
        headers: {
          ...axiosConfig.headers,
          'X-Retry-Count': retryCount.toString()
        }
      });
      return response.data;
    } catch (error) {
      throw createError(error);
    }
  }

  async put<T = any>(url: string, data?: any, config: RetryConfig = {}): Promise<T> {
    try {
      const { retry, retryCount, retryDelay, maxRetries, ...axiosConfig } = config;
      const response = await this.client.put<T>(url, data, {
        ...axiosConfig,
        headers: {
          ...axiosConfig.headers,
          'X-Retry-Count': retryCount?.toString()
        }
      });
      return response.data;
    } catch (error) {
      throw createError(error);
    }
  }

  async delete<T = any>(url: string, config: RetryConfig = {}): Promise<T> {
    try {
      const { retry, retryCount, retryDelay, maxRetries, ...axiosConfig } = config;
      const response = await this.client.delete<T>(url, {
        ...axiosConfig,
        headers: {
          ...axiosConfig.headers,
          'X-Retry-Count': retryCount?.toString()
        }
      });
      return response.data;
    } catch (error) {
      throw createError(error);
    }
  }

  async upload(url: string, file: File, onProgress?: (progress: number) => void): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await this.client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            onProgress(progress);
          }
        }
      });
      return response.data;
    } catch (error) {
      throw createError(error);
    }
  }
}

export const api = new APIClient();
export default api; 