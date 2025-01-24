import React from 'react';
import { useState } from 'react';
import { auth } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function AccountDeletion() {
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reason, setReason] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const handleDeactivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeactivating(true);
    setError('');

    try {
      const response = await auth.deactivate(reason);
      localStorage.removeItem('token');
      navigate('/login', { 
        state: { message: response.data.message } 
      });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to deactivate account');
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your password');
      return;
    }

    if (!window.confirm(
      'Are you absolutely sure you want to delete your account? This action cannot be undone and will:\n\n' +
      '• Permanently delete all your data\n' +
      '• Remove all your social media connections\n' +
      '• Delete all your posts and media files\n' +
      '• Make your account unrecoverable\n\n' +
      'Please type your password to confirm.'
    )) {
      return;
    }
    
    setIsDeleting(true);
    setError('');

    try {
      const response = await auth.delete(password);
      localStorage.removeItem('token');
      navigate('/login', { 
        state: { message: response.data.message } 
      });
    } catch (err: any) {
      let errorMessage = 'Failed to delete account';
      
      if (err.response?.status === 401) {
        errorMessage = 'Incorrect password. Please try again.';
        setPassword('');
      } else if (err.response?.status === 404) {
        errorMessage = 'Account not found. Please try logging in again.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Account deletion error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold">Account Management</h2>
      </div>

      {/* Deactivation Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Temporarily Deactivate Account</h3>
        <p className="text-gray-600">
          Your account will be deactivated for 30 days. After this period, it will be permanently deleted if not reactivated.
        </p>
        <form onSubmit={handleDeactivate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Reason for deactivation (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <button
            type="submit"
            disabled={isDeactivating}
            className="inline-flex justify-center rounded-md border border-transparent bg-yellow-600 py-2 px-4 text-sm font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeactivating ? 'Deactivating...' : 'Deactivate Account'}
          </button>
        </form>
      </div>

      {/* Deletion Section */}
      <div className="space-y-4 mt-8 pt-8 border-t">
        <h3 className="text-lg font-medium text-red-600">Permanently Delete Account</h3>
        <p className="text-gray-600">
          This action cannot be undone. All your data will be permanently deleted, including:
        </p>
        <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1">
          <li>All your posts and scheduled content</li>
          <li>Your social media connections</li>
          <li>All uploaded media files</li>
          <li>Account settings and preferences</li>
        </ul>
        {!showConfirm ? (
          <button
            onClick={() => {
              setShowConfirm(true);
              setError('');
            }}
            className="inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete Account
          </button>
        ) : (
          <form onSubmit={handleDelete} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm your password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                placeholder="Enter your current password"
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isDeleting || !password}
                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  setPassword('');
                  setError('');
                }}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-md bg-red-50 text-red-700 border border-red-200">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        </div>
      )}
    </div>
  );
} 