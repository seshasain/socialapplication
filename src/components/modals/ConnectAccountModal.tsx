import React, { useState, useEffect } from 'react';
import {
  X,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Check,
  Loader2,
} from 'lucide-react';
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

interface InstagramCredentials {
  username: string;
  password: string;
}

export default function ConnectAccountModal({
  isOpen,
  onClose,
  connectedAccounts = [],
  onAccountConnect,
  onAccountDisconnect,
}: ConnectAccountModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInstagramForm, setShowInstagramForm] = useState(false);
  const [instagramCredentials, setInstagramCredentials] = useState<InstagramCredentials>({
    username: '',
    password: '',
  });
  const navigate = useNavigate();

  const initializeOAuth = async (platform: string) => {
    try {
      setLoading(platform);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { from: '/dashboard' } });
        return;
      }

      const response = await fetch(`http://localhost:5000/api/auth/${platform.toLowerCase()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to initialize ${platform} authentication`);
      }

      const data = await response.json();
      if (!data.authUrl) {
        throw new Error('Invalid authentication URL received');
      }

      // Redirect to OAuth page
      window.location.href = data.authUrl;
    } catch (err) {
      console.error(`${platform} auth error:`, err);
      setError(err instanceof Error ? err.message : `Failed to connect ${platform} account`);
    } finally {
      setLoading(null);
    }
  };

  const handleInstagramConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading('instagram');
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { from: '/dashboard' } });
        return;
      }

      const response = await fetch('http://localhost:5000/api/auth/instagram/connect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(instagramCredentials),
      });

      if (!response.ok) {
        throw new Error('Failed to connect Instagram account');
      }

      const data = await response.json();
      if (data.success) {
        await onAccountConnect('instagram');
        setShowInstagramForm(false);
        setInstagramCredentials({ username: '', password: '' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Instagram account');
    } finally {
      setLoading(null);
    }
  };

  const handleConnect = async (platform: string) => {
    if (platform.toLowerCase() === 'instagram') {
      setShowInstagramForm(true);
      return;
    }

    await initializeOAuth(platform);
  };

  const handleDisconnect = async (accountId: string, platform: string) => {
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
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'pink',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'blue',
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: Twitter,
      color: 'blue',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'blue',
    },
  ];

  const unconnectedPlatforms = platforms.filter(
    (platform) =>
      !connectedAccounts.some(
        (account) =>
          account.platform && account.platform.toLowerCase() === platform.id
      )
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Connect Accounts
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {showInstagramForm ? (
            <form onSubmit={handleInstagramConnect} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Instagram Username
                </label>
                <input
                  type="text"
                  value={instagramCredentials.username}
                  onChange={(e) =>
                    setInstagramCredentials((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Instagram Password
                </label>
                <input
                  type="password"
                  value={instagramCredentials.password}
                  onChange={(e) =>
                    setInstagramCredentials((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInstagramForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading === 'instagram'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading === 'instagram' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Connect'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <>
              {unconnectedPlatforms.length > 0 && (
                <>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    Available Connections
                  </h3>
                  <div className="space-y-2 mb-6">
                    {unconnectedPlatforms.map((platform) => (
                      <button
                        key={platform.id}
                        onClick={() => handleConnect(platform.id)}
                        disabled={loading === platform.id}
                        className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center">
                          <platform.icon
                            className={`w-5 h-5 text-${platform.color}-600 mr-3`}
                          />
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
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    Connected Accounts
                  </h3>
                  <div className="space-y-2">
                    {connectedAccounts.map((account) => {
                      const platform = platforms.find(
                        (p) => p.id === account.platform?.toLowerCase()
                      );
                      if (!platform) return null;

                      return (
                        <div
                          key={account.id}
                          className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50"
                        >
                          <div className="flex items-center">
                            <platform.icon
                              className={`w-5 h-5 text-${platform.color}-600 mr-3`}
                            />
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
                              onClick={() =>
                                handleDisconnect(account.id, platform.name)
                              }
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