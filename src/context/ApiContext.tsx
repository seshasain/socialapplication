import React, { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/apiClient';
import { AuthenticationError, NetworkError, RateLimitError } from '../types/errors';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl?: number;
  key?: string;
  invalidateOn?: string[];
}

interface ApiContextType {
  loading: boolean;
  cache: Map<string, CacheItem<any>>;
  clearCache: (pattern?: string) => void;
  invalidateCache: (keys: string[]) => void;
  request: <T>(
    key: string,
    fetcher: () => Promise<T>,
    config?: CacheConfig
  ) => Promise<T>;
}

const ApiContext = createContext<ApiContextType | null>(null);

const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_DELAY = 60 * 1000; // 1 minute

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const cache = useRef(new Map<string, CacheItem<any>>()).current;
  const pendingRequests = useRef(new Map<string, Promise<any>>()).current;
  const navigate = useNavigate();

  const clearCache = useCallback((pattern?: string) => {
    if (!pattern) {
      cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const key of cache.keys()) {
      if (regex.test(key)) {
        cache.delete(key);
      }
    }
  }, [cache]);

  const invalidateCache = useCallback((keys: string[]) => {
    keys.forEach(key => cache.delete(key));
  }, [cache]);

  const handleError = useCallback((error: any) => {
    if (error instanceof AuthenticationError) {
      clearCache();
      navigate('/login');
      toast.error('Please log in again');
      return;
    }

    if (error instanceof NetworkError) {
      toast.error('Network error. Please check your connection');
      return;
    }

    if (error instanceof RateLimitError) {
      toast.error(`Rate limit exceeded. Please try again in ${Math.ceil(error.metadata.value! / 60)} minutes`);
      return;
    }

    toast.error(error.message || 'An error occurred');
  }, [clearCache, navigate]);

  const request = useCallback(async <T,>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig = {}
  ): Promise<T> => {
    const { ttl = DEFAULT_CACHE_TTL, invalidateOn = [] } = config;
    
    // Check cache first
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    // Check if request is already pending
    const pending = pendingRequests.get(key);
    if (pending) return pending;

    try {
      setLoading(true);
      const promise = fetcher();
      pendingRequests.set(key, promise);

      const data = await promise;
      
      // Cache the result
      cache.set(key, {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl
      });

      // Invalidate related cache entries
      if (invalidateOn.length) {
        invalidateCache(invalidateOn);
      }

      return data;
    } catch (error: any) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
      pendingRequests.delete(key);
    }
  }, [cache, handleError, invalidateCache]);

  // Clean up expired cache entries periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [key, item] of cache.entries()) {
        if (item.expiresAt <= now) {
          cache.delete(key);
        }
      }
    }, 60000); // Clean up every minute

    return () => clearInterval(interval);
  }, [cache]);

  const value = {
    loading,
    cache,
    clearCache,
    invalidateCache,
    request
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}

export function withApi<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithApiComponent(props: P) {
    return (
      <ApiProvider>
        <WrappedComponent {...props} />
      </ApiProvider>
    );
  };
} 