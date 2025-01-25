import { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import { TrialLimits, TrialUsage, TrialExtensionRequest, TRIAL_LIMITS } from '../types/trial';

interface UseTrialManagementReturn {
  isTrialActive: boolean;
  trialDaysLeft: number;
  trialUsage: TrialUsage | null;
  trialLimits: TrialLimits;
  canExtendTrial: boolean;
  loading: boolean;
  error: string | null;
  requestTrialExtension: (reason: string, days: number) => Promise<void>;
  checkTrialEligibility: () => Promise<boolean>;
  getReferralInfo: () => Promise<{
    code: string;
    referralLink: string;
    referredUsers: number;
    daysEarned: number;
  }>;
}

export function useTrialManagement(): UseTrialManagementReturn {
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [trialUsage, setTrialUsage] = useState<TrialUsage | null>(null);
  const [canExtendTrial, setCanExtendTrial] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrialStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_URL}/api/subscription/trial/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trial status');
      }

      const data = await response.json();
      setIsTrialActive(data.isActive);
      setTrialDaysLeft(data.daysLeft);
      setTrialUsage(data.usage);
      setCanExtendTrial(data.canExtend);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trial status');
    } finally {
      setLoading(false);
    }
  };

  const requestTrialExtension = async (reason: string, days: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_URL}/api/subscription/trial/extend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason, days })
      });

      if (!response.ok) {
        throw new Error('Failed to request trial extension');
      }

      await fetchTrialStatus(); // Refresh trial status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request trial extension');
      throw err;
    }
  };

  const checkTrialEligibility = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_URL}/api/subscription/trial/eligibility`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check trial eligibility');
      }

      const data = await response.json();
      return data.eligible;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check trial eligibility');
      return false;
    }
  };

  const getReferralInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_URL}/api/subscription/trial/referral`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get referral information');
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get referral information');
      throw err;
    }
  };

  useEffect(() => {
    fetchTrialStatus();
  }, []);

  return {
    isTrialActive,
    trialDaysLeft,
    trialUsage,
    trialLimits: TRIAL_LIMITS,
    canExtendTrial,
    loading,
    error,
    requestTrialExtension,
    checkTrialEligibility,
    getReferralInfo
  };
} 