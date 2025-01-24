import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/user';
import { auth } from '../utils/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);

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
    } finally {
      setIsLoading(false);
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

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        isAuthenticated,
        isLoading,
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