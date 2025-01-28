import React, { useState } from 'react';
import { notionService } from '../../services/notion/notionService';
import { NotionDatabase, NotionError } from '../../types/notion';

interface NotionConnectProps {
  onDatabaseSelect: (database: NotionDatabase) => void;
}

export function NotionConnect({ onDatabaseSelect }: NotionConnectProps) {
  const [accessToken, setAccessToken] = useState('');
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!accessToken) {
      setError('Please enter your Notion access token');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await notionService.initialize({ accessToken, databaseId: '' });
      const fetchedDatabases = await notionService.getDatabases();
      setDatabases(fetchedDatabases);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while connecting to Notion');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDatabaseSelect = (database: NotionDatabase) => {
    onDatabaseSelect(database);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Connect to Notion</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
            Notion Access Token
          </label>
          <input
            id="token"
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your Notion access token"
          />
        </div>

        <button
          onClick={handleConnect}
          disabled={isLoading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Connecting...' : 'Connect to Notion'}
        </button>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {databases.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Select a Database</h3>
            <div className="space-y-2">
              {databases.map((database) => (
                <button
                  key={database.id}
                  onClick={() => handleDatabaseSelect(database)}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <div className="font-medium text-gray-900">{database.title}</div>
                  {database.description && (
                    <div className="text-sm text-gray-500 mt-1">{database.description}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 