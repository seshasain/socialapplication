import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/user';
import { auth } from '../utils/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (data: SignupData) => Promise<{ token: string; user: User; redirectUrl: string }>;
  signInWithGoogle: () => Promise<void>;
  refreshUser: () => Promise<void>;
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

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      return;
    }

    try {
      const response = await auth.me();
      const userData = response.data;
      const formattedUser: User = {
        ...userData,
        subscription: userData.subscription || {
          planId: 'free',
          status: 'active'
        }
      };
      setUser(formattedUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await auth.login({ email, password });
      const data = response.data;
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
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Login failed');
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
      console.error('Signup error:', error);
      // Get the error message from the response if available
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to create account';
      throw new Error(errorMessage);
    }
  };

  const signInWithGoogle = async () => {
    // Implement Google Sign-in logic
    throw new Error('Not implemented');
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        isAuthenticated, 
        login, 
        logout, 
        signup, 
        signInWithGoogle,
        refreshUser 
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