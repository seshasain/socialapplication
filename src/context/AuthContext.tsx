import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            // Ensure subscription data is properly structured
            const formattedUser: User = {
              ...userData,
              subscription: userData.subscription || {
                planId: 'free',
                status: 'active'
              }
            };
            setUser(formattedUser);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('token');
            setUser(null);
            setIsAuthenticated(false)
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    // Ensure subscription data is properly structured
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
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const signup = async (email: string, password: string, name: string) => {
    const response = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      throw new Error('Signup failed');
    }

    const data = await response.json();
    // Ensure subscription data is properly structured
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
  };

  const signInWithGoogle = async () => {
    // Implement Google Sign-in logic
    throw new Error('Not implemented');
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, login, logout, signup, signInWithGoogle }}
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