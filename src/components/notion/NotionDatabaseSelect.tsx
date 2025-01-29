import React, { useState, useEffect } from 'react';
import { notionService } from '../../services/notion/notionService';
import { NotionDatabase } from '../../types/notion';
import { toast } from 'react-hot-toast';
import { Database, RefreshCw, Search, ChevronRight, AlertCircle } from 'lucide-react';

interface NotionDatabaseSelectProps {
  onDatabaseSelect: (database: NotionDatabase) => void;
  onError: (error: string) => void;
}

export function NotionDatabaseSelect({ onDatabaseSelect, onError }: NotionDatabaseSelectProps) {
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDatabases();
  }, []);

  const loadDatabases = async () => {
    try {
      const response = await fetch('/api/notion/databases', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch databases');
      }

      const data = await response.json();
      setDatabases(data.databases);
    } catch (err) {
      if (err instanceof Error) {
        onError(err.message);
      } else {
        onError('Failed to load Notion databases');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (database: NotionDatabase) => {
    setSelectedId(database.id);
    try {
      const response = await fetch('/api/notion/select-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ databaseId: database.id })
      });

      if (!response.ok) {
        throw new Error('Failed to select database');
      }

      onDatabaseSelect(database);
      toast.success('Successfully connected to Notion database');
    } catch (err) {
      if (err instanceof Error) {
        onError(err.message);
      } else {
        onError('Failed to select database');
      }
      setSelectedId(null);
    }
  };

  const filteredDatabases = databases.filter(db =>
    db.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading your Notion databases...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Select a Database</h2>
        <button
          onClick={loadDatabases}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search databases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="space-y-3">
        {filteredDatabases.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Database className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No databases found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery
                ? 'No databases match your search query'
                : 'No databases found in your Notion workspace'}
            </p>
            <div className="mt-6">
              <button
                onClick={loadDatabases}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh List
              </button>
            </div>
          </div>
        ) : (
          filteredDatabases.map((database) => (
            <button
              key={database.id}
              onClick={() => handleSelect(database)}
              disabled={selectedId === database.id}
              className={`w-full flex items-center justify-between p-4 border rounded-lg transition-all ${
                selectedId === database.id
                  ? 'border-green-500 bg-green-50 ring-2 ring-green-500 ring-opacity-50'
                  : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center min-w-0">
                <Database className={`flex-shrink-0 h-6 w-6 ${
                  selectedId === database.id ? 'text-green-500' : 'text-gray-400'
                }`} />
                <div className="ml-4 min-w-0">
                  <h3 className={`font-medium truncate ${
                    selectedId === database.id ? 'text-green-900' : 'text-gray-900'
                  }`}>
                    {database.title}
                  </h3>
                  {database.description && (
                    <p className={`mt-1 text-sm truncate ${
                      selectedId === database.id ? 'text-green-700' : 'text-gray-500'
                    }`}>
                      {database.description}
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight className={`flex-shrink-0 ml-4 h-5 w-5 ${
                selectedId === database.id ? 'text-green-500' : 'text-gray-400'
              }`} />
            </button>
          ))
        )}
      </div>

      <div className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
        <AlertCircle className="h-4 w-4" />
        <p>Select the database where you want to manage your social media posts</p>
      </div>
    </div>
  );
} 