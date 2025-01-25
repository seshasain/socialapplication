import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/user';
import type { TrialState, TrialExtensionRequest } from '../types/trial';
import { auth } from '../utils/api';
import { subscription } from '../utils/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  trialState: TrialState | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (data: SignupData) => Promise<{ token: string; user: User; redirectUrl: string }>;
  signInWithGoogle: () => Promise<void>;
  refreshUser: () => Promise<void>;
  startTrial: () => Promise<void>;
  extendTrial: (days: number, reason: string) => Promise<void>;
  convertTrialToPaid: (planId: string) => Promise<void>;
  checkTrialEligibility: () => Promise<boolean>;
  refreshTrialState: () => Promise<void>;
  getReferralInfo: () => Promise<void>;
}

interface SignupData {
  email: string;
  password: string;
  name: string;
  redirectUrl: string | null;
  captchaToken: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [trialState, setTrialState] = useState<TrialState | null>(null);

  const refreshTrialState = async () => {
    if (!user?.subscription?.isInTrial) {
      setTrialState(null);
      return;
    }

    try {
      const [trialStatus, trialUsage, extensionRequest, referralInfo] = await Promise.all([
        subscription.getTrialStatus(),
        subscription.getTrialUsage(),
        subscription.getLastExtensionRequest(),
        subscription.getReferralInfo()
      ]);

      setTrialState({
        isActive: trialStatus.isActive,
        daysLeft: trialStatus.daysLeft,
        usage: trialUsage,
        hasRequestedExtension: !!extensionRequest,
        lastExtensionRequest: extensionRequest,
        referralInfo: referralInfo
      });
    } catch (error) {
      console.error('Failed to refresh trial state:', error);
    }
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      const response = await auth.me();
      const userData = response.data;
      
      const formattedUser: User = {
        ...userData,
        subscription: {
          ...userData.subscription,
          isInTrial: userData.subscription?.status === 'trial',
        }
      };
      
      setUser(formattedUser);
      setIsAuthenticated(true);

      // Refresh trial state if user is in trial
      if (formattedUser.subscription?.isInTrial) {
        await refreshTrialState();
      }
    } catch (error: any) {
      console.error('Failed to refresh user data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
      }
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Attempting login...');
      const response = await auth.login({ email, password });
      console.log('AuthContext: Login response received:', response.data);
      
      const data = response.data;
      if (!data.token) {
        throw new Error('No token received from server');
      }
      
      const formattedUser: User = {
        ...data.user,
        subscription: data.user.subscription || {
          planId: 'free',
          status: 'active'
        }
      };
      
      localStorage.setItem('token', data.token);
      setUser(formattedUser);
      setIsAuthenticated(true);
      console.log('AuthContext: Login successful, user set');
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const signup = async ({ email, password, name, redirectUrl, captchaToken }: SignupData) => {
    try {
      const response = await auth.signup({ 
        email, 
        password, 
        name,
        redirectUrl,
        captchaToken 
      });
      
      const { token, user: userData } = response.data;
      
      // Store token
      localStorage.setItem('token', token);
      
      // Format and set user data
      const formattedUser: User = {
        ...userData,
        subscription: userData.subscription || {
          planId: 'free',
          status: 'active'
        }
      };
      
      // Update auth state
      setUser(formattedUser);
      setIsAuthenticated(true);
      
      return response.data;
    } catch (error: any) {
      // Log the error but don't include the full error object
      console.error('Signup error:', error.message);
      // Rethrow the error with just the message
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    // Implement Google Sign-in logic 
    throw new Error('Not implemented');
  };

  const startTrial = async () => {
    try {
      await auth.startTrial();
      await refreshUser();
    } catch (error) {
      console.error('Failed to start trial:', error);
      throw error;
    }
  };

  const extendTrial = async (days: number, reason: string) => {
    try {
      await auth.extendTrial(days);
      await refreshUser();
      await refreshTrialState();
    } catch (error) {
      console.error('Failed to extend trial:', error);
      throw error;
    }
  };

  const convertTrialToPaid = async (planId: string) => {
    try {
      await subscription.convertTrial(planId);
      await refreshUser();
    } catch (error) {
      console.error('Failed to convert trial to paid:', error);
      throw error;
    }
  };

  const checkTrialEligibility = async () => {
    try {
      const response = await subscription.checkTrialEligibility();
      return response.data.isEligible;
    } catch (error) {
      console.error('Failed to check trial eligibility:', error);
      return false;
    }
  };

  const getReferralInfo = async () => {
    try {
      const response = await subscription.getReferralInfo();
      if (trialState) {
        setTrialState({
          ...trialState,
          referralInfo: response.data
        });
      }
    } catch (error) {
      console.error('Failed to get referral info:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        isAuthenticated,
        isLoading,
        trialState,
        login, 
        logout, 
        signup, 
        signInWithGoogle,
        refreshUser,
        startTrial,
        extendTrial,
        convertTrialToPaid,
        checkTrialEligibility,
        refreshTrialState,
        getReferralInfo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}