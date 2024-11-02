import React, { useState, useEffect } from 'react';
import { X, Instagram, Facebook, Twitter, Linkedin, Youtube, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ConnectAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedAccounts: SocialAccount[];
  onAccountConnect: (platform: string) => Promise<void>;
  onAccountDisconnect: (accountId: string) => Promise<void>;
}

interface SocialAccount {
  id: string;
  platform: string;
  followerCount: number;
}

export default function ConnectAccountModal({ 
  isOpen, 
  onClose, 
  connectedAccounts = [],
  onAccountConnect,
  onAccountDisconnect
}: ConnectAccountModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleTwitterConnect = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: '/dashboard' } });
      return;
    }

    try {
      setLoading('twitter');
      setError(null);
      const response = await fetch('http://localhost:5000/api/auth/twitter', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to initialize Twitter authentication');
      }
      
      const data = await response.json();
      if (!data.authUrl) {
        throw new Error('Invalid authentication URL received');
      }
      
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Twitter auth error:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect Twitter account');
    } finally {
      setLoading(null);
    }
  };

  const handleConnect = async (platform: string, connectHandler: (platform: string) => Promise<void>) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: '/dashboard' } });
      return;
    }

    try {
      setLoading(platform);
      setError(null);
      await connectHandler(platform.toLowerCase());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect account');
    } finally {
      setLoading(null);
    }
  };

  const handleDisconnect = async (accountId: string, platform: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: '/dashboard' } });
      return;
    }

    try {
      setLoading(platform);
      setError(null);
      await onAccountDisconnect(accountId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect account');
    } finally {
      setLoading(null);
    }
  };

  if (!isOpen) return null;

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'pink', connectHandler: onAccountConnect },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'blue', connectHandler: onAccountConnect },
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'blue', connectHandler: handleTwitterConnect },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'blue', connectHandler: onAccountConnect },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'red', connectHandler: onAccountConnect },
    { 
      id: 'tiktok',
      name: 'TikTok', 
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0011.14-4.02v-6.3a8.16 8.16 0 004.65 1.49v-3.39a4.85 4.85 0 01-1.2-1.19z"/>
        </svg>
      ), 
      color: 'black',
      connectHandler: onAccountConnect
    }
  ];

  const unconnectedPlatforms = platforms.filter(
    platform => !connectedAccounts.some(
      account => account.platform && account.platform.toLowerCase() === platform.id
    )
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Connect Accounts</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {!localStorage.getItem('token') && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-200 text-yellow-700 rounded-lg">
              Please log in to connect your social media accounts
            </div>
          )}

          {unconnectedPlatforms.length > 0 && (
            <>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Available Connections</h3>
              <div className="space-y-2 mb-6">
                {unconnectedPlatforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => handleConnect(platform.id, platform.connectHandler)}
                    disabled={loading === platform.id}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center">
                      <platform.icon className={`w-5 h-5 text-${platform.color}-600 mr-3`} />
                      <span className="font-medium">{platform.name}</span>
                    </div>
                    {loading === platform.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    ) : (
                      <span className="text-sm text-blue-600">Connect</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {connectedAccounts.length > 0 && (
            <>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Connected Accounts</h3>
              <div className="space-y-2">
                {connectedAccounts.map((account) => {
                  const platform = platforms.find(p => p.id === account.platform?.toLowerCase());
                  if (!platform) return null;

                  return (
                    <div
                      key={account.id}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center">
                        <platform.icon className={`w-5 h-5 text-${platform.color}-600 mr-3`} />
                        <div>
                          <span className="font-medium">{platform.name}</span>
                          <p className="text-sm text-gray-500">
                            {account.followerCount.toLocaleString()} followers
                          </p>
                        </div>
                      </div>
                      {loading === platform.name ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                      ) : (
                        <button
                          onClick={() => handleDisconnect(account.id, platform.name)}
                          className="text-sm text-gray-600 hover:text-red-600 transition-colors"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <p className="mt-6 text-sm text-gray-500 text-center">
            Connecting accounts enables automatic post scheduling
          </p>
        </div>
      </div>
    </div>
  );
}