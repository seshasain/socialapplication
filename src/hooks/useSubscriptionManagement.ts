import { useState } from 'react';
import { API_URL } from '../config/api';
import { Plan, PlanType } from '../types/plans';

interface UpgradeOptions {
  preserveUnusedPosts?: boolean;
  transferSettings?: boolean;
  startImmediately?: boolean;
}

interface UseSubscriptionManagementReturn {
  loading: boolean;
  error: string | null;
  upgradePlan: (newPlanId: PlanType, options?: UpgradeOptions) => Promise<void>;
  cancelSubscription: (reason?: string) => Promise<void>;
  reactivateSubscription: () => Promise<void>;
  updatePaymentMethod: (paymentMethodId: string) => Promise<void>;
  getCurrentPlan: () => Promise<Plan | null>;
  getUpgradePreview: (newPlanId: PlanType) => Promise<{
    prorated_amount: number;
    next_billing_date: string;
    unused_time_credit: number;
  }>;
}

export function useSubscriptionManagement(): UseSubscriptionManagementReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upgradePlan = async (newPlanId: PlanType, options: UpgradeOptions = {}) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_URL}/api/subscription/upgrade`, {
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
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upgrade plan');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (reason?: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_URL}/api/subscription/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel subscription');
      }
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
        const error = await response.json();
        throw new Error(error.message || 'Failed to reactivate subscription');
      }
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