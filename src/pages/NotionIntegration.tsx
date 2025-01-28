import React, { useState, useCallback } from 'react';
import { NotionConnect } from '../components/notion/NotionConnect';
import { NotionPosts } from '../components/notion/NotionPosts';
import { NotionDatabase, NotionConnectionState } from '../types/notion';
import { toast } from 'react-hot-toast';

export function NotionIntegration() {
  const [connectionState, setConnectionState] = useState<NotionConnectionState>({
    isConnected: false
  });
  const [error, setError] = useState<string | null>(null);

  const handleDatabaseSelect = useCallback((database: NotionDatabase) => {
    setConnectionState({
      isConnected: true,
      selectedDatabase: database,
      lastSync: new Date()
    });
    toast.success('Successfully connected to Notion database');
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    toast.error(errorMessage);
    // Clear error after 5 seconds
    const timeoutId = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleDisconnect = useCallback(() => {
    setConnectionState({ isConnected: false });
    toast.success('Disconnected from Notion');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notion Integration</h1>
          <p className="mt-2 text-gray-600">
            Connect your Notion database to manage your social media posts
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!connectionState.isConnected ? (
          <NotionConnect onDatabaseSelect={handleDatabaseSelect} />
        ) : (
          <>
            <div className="bg-white shadow rounded-lg p-4 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    Connected Database: {connectionState.selectedDatabase?.title}
                  </h2>
                  {connectionState.lastSync && (
                    <p className="text-sm text-gray-500">
                      Last synced: {connectionState.lastSync.toLocaleString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Disconnect
                </button>
              </div>
            </div>

            {connectionState.selectedDatabase && (
              <NotionPosts
                databaseId={connectionState.selectedDatabase.id}
                onError={handleError}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
} 