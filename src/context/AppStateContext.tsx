import React, { createContext, useContext, ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import type { Post, SocialAccount, AnalyticsData, AnalyticsParams } from '../types';
import { posts, socialAccounts, analytics } from '../utils/api';

interface AppState {
  socialAccounts: SocialAccount[];
  posts: Post[];
  analytics: AnalyticsData | null;
  refreshData: () => Promise<void>;
}

const AppStateContext = createContext<AppState | null>(null);

// Configure with aggressive caching for cost effectiveness
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      gcTime: 30 * 60 * 1000, // Keep unused data in cache for 30 minutes
      retry: 3, // Retry failed requests 3 times
      retryDelay: (attemptIndex: number) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
      refetchOnWindowFocus: false, // Disable automatic refetching on window focus
      refetchOnMount: false, // Disable automatic refetching on component mount
    },
  },
});

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { data: socialAccountsData } = useQuery({
    queryKey: ['socialAccounts'],
    queryFn: () => socialAccounts.list()
  });

  const { data: postsData } = useQuery({
    queryKey: ['posts'],
    queryFn: () => posts.list()
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => analytics.overview()
  });

  const refreshData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['socialAccounts'] }),
      queryClient.invalidateQueries({ queryKey: ['posts'] }),
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    ]);
  };

  const value: AppState = {
    socialAccounts: socialAccountsData?.data || [],
    posts: postsData?.data || [],
    analytics: analyticsData?.data || null,
    refreshData
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}

export function AppRoot({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>
        {children}
      </AppStateProvider>
    </QueryClientProvider>
  );
}

// Custom hooks for optimized data fetching
export function usePostsQuery(options = {}) {
  return useQuery({
    queryKey: ['posts'],
    queryFn: posts.list,
    ...options,
  });
}

export function useSocialAccountsQuery(options = {}) {
  return useQuery({
    queryKey: ['socialAccounts'],
    queryFn: socialAccounts.list,
    ...options,
  });
}

export function useAnalyticsQuery(params: AnalyticsParams, options = {}) {
  return useQuery({
    queryKey: ['analytics', params],
    queryFn: () => analytics.overview(params),
    ...options,
  });
} 