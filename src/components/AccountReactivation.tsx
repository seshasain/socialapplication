import React from 'react';
import { useState } from 'react';
import { auth } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function AccountReactivation() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isReactivating, setIsReactivating] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleReactivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsReactivating(true);
    setError('');

    try {
      const response = await auth.reactivate({ email, password });
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to reactivate account');
    } finally {
      setIsReactivating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reactivate your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email and password to reactivate your account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleReactivate}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isReactivating}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isReactivating ? 'Reactivating...' : 'Reactivate Account'}
            </button>
          </div>
        </form>

        <div className="text-sm text-center">
          <button
            onClick={() => navigate('/login')}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Return to login
          </button>
        </div>
      </div>
    </div>
  );
} 