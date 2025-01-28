import { useState } from 'react';
import { API_URL } from '../config/api';
import { PlanType } from '../types/plans';
import { SubscriptionStatus } from '../types/subscription';
import { useAuth } from '../context/AuthContext';
import { subscription } from '../utils/api';

export interface UpgradeOptions {
  preserveUnusedPosts?: boolean;
  transferSettings?: boolean;
  startImmediately?: boolean;
}

export interface SubscriptionState {
  status: SubscriptionStatus;
  planId: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date | null;
}

export interface UseSubscriptionManagementReturn {
  loading: boolean;
  error: string | null;
  upgradePlan: (newPlanId: PlanType, options?: UpgradeOptions) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  reactivateSubscription: () => Promise<void>;
  updatePaymentMethod: (paymentMethodId: string) => Promise<void>;
  getCurrentPlan: () => Promise<SubscriptionState>;
  getUpgradePreview: (newPlanId: PlanType) => Promise<{
    prorated_amount: number;
    next_billing_date: Date;
    unused_time_credit: number;
  }>;
}

export function useSubscriptionManagement(): UseSubscriptionManagementReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, refreshUser } = useAuth();
  const isTrialUser = user?.subscription?.status === SubscriptionStatus.TRIAL;
  const isBasicUser = user?.subscription?.planId === 'basic';
  const isProUser = user?.subscription?.planId === 'pro';

  const upgradePlan = async (newPlanId: PlanType, options: UpgradeOptions = {}) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const currentPlan = await getCurrentPlan();
      const endpoint = currentPlan.status === SubscriptionStatus.TRIAL ? 
        '/api/subscription/convert-trial' : 
        '/api/subscription/upgrade';

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId: newPlanId,
          preserveUnusedPosts: options.preserveUnusedPosts ?? true,
          transferSettings: options.transferSettings ?? true,
          startImmediately: options.startImmediately ?? false
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upgrade plan');
      }

      // Refresh application state after successful upgrade
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upgrade plan');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_URL}/api/subscription/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      // Refresh application state
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reactivateSubscription = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_URL}/api/subscription/reactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to reactivate subscription');
      }

      // Refresh application state
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentMethod = async (paymentMethodId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_URL}/api/subscription/payment-method`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentMethodId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update payment method');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update payment method');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPlan = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_URL}/api/subscription/current-plan`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch current plan');
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch current plan');
      return null;
    }
  };

  const getUpgradePreview = async (newPlanId: PlanType) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_URL}/api/subscription/upgrade-preview?planId=${newPlanId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get upgrade preview');
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get upgrade preview');
      throw err;
    }
  };

  return {
    loading,
    error,
    upgradePlan,
    cancelSubscription,
    reactivateSubscription,
    updatePaymentMethod,
    getCurrentPlan,
    getUpgradePreview
  };
} 