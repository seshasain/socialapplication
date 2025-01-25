import { useState, useEffect } from 'react';
import { API_URL } from '../config/api';

interface UsageStats {
  monthlyPosts: {
    used: number;
    remaining: number;
    total: number;
  };
  platformPosts: Record<string, {
    used: number;
    remaining: number;
    total: number;
  }>;
  scheduledPosts: {
    used: number;
    remaining: number;
    total: number;
  };
  rolloverPosts: {
    amount: number;
    expiresAt: string;
  } | null;
}

interface ValidationResult {
  canPost: boolean;
  errors: string[];
  warnings: string[];
}

export function useUsageTracking() {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_URL}/api/usage/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch usage stats');
      }

      const data = await response.json();
      setUsage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch usage');
    } finally {
      setLoading(false);
    }
  };

  const validatePostCreation = (
    platforms: string[],
    postType: string
  ): ValidationResult => {
    if (!usage) {
      return {
        canPost: false,
        errors: ['Usage stats not available'],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check monthly post limit
    if (usage.monthlyPosts.remaining < platforms.length) {
      errors.push(`Monthly post limit exceeded. You have ${usage.monthlyPosts.remaining} posts remaining.`);
    }

    // Check per-platform limits
    platforms.forEach(platform => {
      const platformUsage = usage.platformPosts[platform];
      if (platformUsage && platformUsage.remaining <= 0) {
        errors.push(`Post limit exceeded for ${platform}.`);
      } else if (platformUsage && platformUsage.remaining <= 5) {
        warnings.push(`Only ${platformUsage.remaining} posts remaining for ${platform}.`);
      }
    });

    // Check scheduled posts limit
    if (usage.scheduledPosts.remaining <= 0) {
      errors.push('Scheduled posts limit reached.');
    } else if (usage.scheduledPosts.remaining <= 3) {
      warnings.push(`Only ${usage.scheduledPosts.remaining} scheduled posts remaining.`);
    }

    return {
      canPost: errors.length === 0,
      errors,
      warnings
    };
  };

  const trackPostCreation = async (
    platforms: string[],
    postType: string
  ): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_URL}/api/usage/track`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platforms,
          postType,
          count: platforms.length
        })
      });

      if (!response.ok) {
        throw new Error('Failed to track post usage');
      }

      // Refresh usage stats
      await fetchUsage();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to track usage');
      return false;
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  return {
    usage,
    loading,
    error,
    validatePostCreation,
    trackPostCreation,
    refreshUsage: fetchUsage
  };
} 