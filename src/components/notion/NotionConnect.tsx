import React, { useState } from 'react';
import { notionService } from '../../services/notion/notionService';
import { NotionDatabase } from '../../types/notion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { LogIn, ChevronRight, Shield, Database } from 'lucide-react';

interface NotionConnectProps {
  onDatabaseSelect: (database: NotionDatabase) => void;
}

export function NotionConnect({ onDatabaseSelect }: NotionConnectProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const handleConnect = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to connect your Notion workspace');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/notion', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize Notion connection');
      }

      window.location.href = data.authUrl;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-8">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-black rounded-2xl p-4 w-16 h-16 flex items-center justify-center">
            <svg viewBox="0 0 120 126" className="w-12 h-12 text-white" fill="currentColor">
              <path d="M 20.6927 21.9315C 24.5836 25.0924 26.0432 24.8512 33.3492 24.3638L 95.3575 21.7125C 96.8171 21.7125 95.8373 20.2528 95.3575 19.7731L 84.8207 10.6795C 83.1198 9.21981 80.9393 7.51888 77.0484 7.76007L 17.5214 11.1593C 15.5796 11.1593 15.3384 12.1391 15.8182 12.8577L 20.6927 21.9315ZM 24.5836 37.2282V 110.014C 24.5836 114.167 26.5254 115.386 31.1589 115.146L 98.5288 111.474C 103.162 111.233 103.883 108.813 103.883 105.139V 33.5576C 103.883 29.8869 102.902 28.187 99.2515 28.4282L 29.2169 32.3391C 25.5462 32.5803 24.5836 34.0399 24.5836 37.2282ZM 95.5987 41.6197C 96.0785 44.0872 95.3575 46.5547 92.6511 46.7959L 89.4628 47.2757V 98.6772C 85.5517 100.859 81.8811 102.08 78.6927 102.08C 73.5771 102.08 72.3564 100.378 69.4088 96.0066L 47.1245 57.5723V 94.5469L 54.0717 96.2478C 54.0717 96.2478 54.0717 102.08 45.9037 102.08L 30.5873 103.04C 30.1075 101.341 30.5873 98.4361 32.7678 97.7174L 36.1973 96.7376V 51.4292L 31.6387 51.1881C 31.1589 48.7206 32.5273 45.5322 36.4384 45.291L 53.1122 44.0872L 76.1259 83.9879V 48.9617L 71.2515 48.4819C 70.7717 45.5322 72.5939 43.5904 75.5415 43.3492L 95.5987 41.6197Z"/>
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
          Connect to Notion
        </h2>
        
        <p className="text-center text-gray-600 mb-8 max-w-md mx-auto">
          Connect your Notion workspace to seamlessly manage and schedule your social media content
        </p>

        <div className="space-y-6 max-w-md mx-auto">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2 flex items-center">
              <Database className="w-5 h-5 mr-2 text-gray-500" />
              Database Integration
            </h3>
            <p className="text-sm text-gray-600">
              Select any Notion database to manage your posts. We'll sync your content automatically.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-gray-500" />
              Secure Access
            </h3>
            <p className="text-sm text-gray-600">
              We only request the minimum permissions needed to manage your selected database.
            </p>
          </div>

          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Connect with Notion
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm text-gray-600">Secure connection</span>
          </div>
          <a
            href="https://www.notion.so/help"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Need help?
          </a>
        </div>
      </div>
    </div>
  );
} 