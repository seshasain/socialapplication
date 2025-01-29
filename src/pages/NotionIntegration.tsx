import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { NotionConnect } from '../components/notion/NotionConnect';
import { NotionDatabaseSelect } from '../components/notion/NotionDatabaseSelect';
import { NotionPosts } from '../components/notion/NotionPosts';
import { NotionDatabase, NotionConnectionState } from '../types/notion';
import { toast } from 'react-hot-toast';
import { Database, CheckCircle2, AlertCircle, ArrowLeft, RefreshCcw, Settings } from 'lucide-react';

export function NotionIntegration() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [connectionState, setConnectionState] = useState<NotionConnectionState>({
    isConnected: false,
    step: 1
  });
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check for OAuth callback
  useEffect(() => {
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');

    if (platform === 'notion' && status === 'connected') {
      navigate('/notion', { replace: true });
      setConnectionState(prev => ({ ...prev, isConnected: true, step: 2 }));
      toast.success('Successfully connected to Notion!', {
        icon: '🎉',
        duration: 4000
      });
    } else if (platform === 'notion' && status === 'error') {
      setError('Failed to connect to Notion. Please try again.');
      toast.error('Connection failed', {
        icon: '❌'
      });
    }
  }, [searchParams, navigate]);

  const handleDatabaseSelect = useCallback((database: NotionDatabase) => {
    setConnectionState({
      isConnected: true,
      selectedDatabase: database,
      lastSync: new Date(),
      step: 3
    });
    toast.success('Database connected successfully!', {
      icon: '📚',
      duration: 4000
    });
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    toast.error(errorMessage);
    const timeoutId = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleDisconnect = useCallback(async () => {
    try {
      const response = await fetch('/api/notion/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect from Notion');
      }

      setConnectionState({ isConnected: false, step: 1 });
      toast.success('Disconnected from Notion', {
        icon: '👋'
      });
    } catch (err) {
      if (err instanceof Error) {
        handleError(err.message);
      } else {
        handleError('Failed to disconnect from Notion');
      }
    }
  }, [handleError]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Add your refresh logic here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated refresh
      toast.success('Content refreshed!');
    } catch (error) {
      toast.error('Failed to refresh content');
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="max-w-2xl mx-auto mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 -z-10" />
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === connectionState.step
                  ? 'bg-blue-600 text-white'
                  : step < connectionState.step
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step < connectionState.step ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                step
              )}
            </div>
            <span className="mt-2 text-sm font-medium text-gray-600">
              {step === 1 ? 'Connect' : step === 2 ? 'Select Database' : 'Manage Posts'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notion Integration</h1>
              <p className="mt-2 text-gray-600">
                Connect your Notion workspace to manage your social media posts
              </p>
            </div>
            {connectionState.isConnected && (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <RefreshCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>

        {renderStepIndicator()}

        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto">
          {!connectionState.isConnected ? (
            <NotionConnect onDatabaseSelect={handleDatabaseSelect} />
          ) : !connectionState.selectedDatabase ? (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <NotionDatabaseSelect
                  onDatabaseSelect={handleDatabaseSelect}
                  onError={handleError}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Database className="w-5 h-5 text-gray-500" />
                    <h2 className="text-lg font-medium text-gray-900">
                      {connectionState.selectedDatabase.title}
                    </h2>
                  </div>
                  {connectionState.lastSync && (
                    <span className="text-sm text-gray-500">
                      Last synced: {connectionState.lastSync.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <NotionPosts
                databaseId={connectionState.selectedDatabase.id}
                onError={handleError}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 