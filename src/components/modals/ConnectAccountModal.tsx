import React, { useState, useEffect } from 'react';
import {
  X, Instagram, Facebook, Twitter, Linkedin, Youtube, Music2, 
  MessageCircle, Pin, Loader2, Crown, Zap, ChevronRight, Lock,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { APP_URL } from '../../config/api';
interface ConnectAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLATFORMS = [
  { 
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    minPlan: 'free',
    benefit: 'Schedule posts & track engagement metrics'
  },
  { 
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    minPlan: 'free',
    benefit: 'Auto-post photos & manage stories'
  },
  { 
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    minPlan: 'free',
    benefit: 'Share updates & grow your network'
  },
  { 
    id: 'threads',
    name: 'Threads',
    icon: MessageCircle,
    color: 'text-gray-900',
    bgColor: 'bg-gray-50',
    minPlan: 'basic',
    benefit: 'Engage with text-based discussions'
  },
  { 
    id: 'pinterest',
    name: 'Pinterest',
    icon: Pin,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    minPlan: 'basic',
    benefit: 'Share visual content & drive traffic'
  },
  { 
    id: 'twitter',
    name: 'Twitter',
    icon: Twitter,
    color: 'text-blue-400',
    bgColor: 'bg-blue-50',
    minPlan: 'pro',
    benefit: 'Real-time updates & thread management'
  },
  { 
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    minPlan: 'pro',
    benefit: 'Manage videos & track analytics'
  },
  { 
    id: 'tiktok',
    name: 'TikTok',
    icon: Music2,
    color: 'text-gray-900',
    bgColor: 'bg-gray-50',
    minPlan: 'pro',
    benefit: 'Schedule short-form videos & trends'
  },
] as const;

const PLANS = {
  free: { name: 'Free', platforms: 3 },
  basic: { name: 'Basic', icon: Zap, platforms: 5 },
  pro: { name: 'Pro', icon: Crown, platforms: 'Unlimited' },
} as const;

function PlanBadge({ plan }: { plan: 'basic' | 'pro' }) {
  const config = {
    basic: { icon: Zap, bg: 'bg-blue-100', text: 'text-blue-700' },
    pro: { icon: Crown, bg: 'bg-purple-100', text: 'text-purple-700' }
  }[plan];
  
  const Icon = config.icon;
  
  return (
    <div className={`flex items-center px-2.5 py-1 rounded-full ${config.bg} ${config.text}`}>
      <Icon className="w-3.5 h-3.5 mr-1" />
      <span className="text-xs font-medium">{plan.charAt(0).toUpperCase() + plan.slice(1)}</span>
    </div>
  );
}

export default function ConnectAccountModal({ isOpen, onClose }: ConnectAccountModalProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const userPlan = user?.subscription?.planId || 'free';
  const connectedAccounts = user?.socialAccounts || [];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/dashboard' } });
    }
  }, [isAuthenticated, navigate]);

  const initializeOAuth = async (platform: string) => {
    try {
      setLoadingStates(prev => ({ ...prev, [platform]: true }));
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { from: '/dashboard' } });
        return;
      }
      const response = await fetch(`${APP_URL}/api/auth/${platform.toLowerCase()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Failed to initialize ${platform} authentication`);
      const data = await response.json();
      if (!data.authUrl) throw new Error('Invalid authentication URL received');
      window.location.href = data.authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to connect ${platform} account`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [platform]: false }));
    }
  };

  const handleDisconnect = async (accountId: string, platform: string) => {
    try {
      setLoadingStates(prev => ({ ...prev, [platform]: true }));
      setError(null);
      
      const response = await fetch(`${APP_URL}/api/social-accounts/${accountId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to disconnect ${platform} account`);
      }

      // Refresh user data to update the connected accounts list
      await refreshUser();
      
      setLoadingStates(prev => ({ ...prev, [platform]: false }));
      setError(null);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to disconnect account');
      setLoadingStates(prev => ({ ...prev, [platform]: false }));
    }
  };

  const handleConnect = async (platformId: string, minPlan: string) => {
    if (minPlan !== 'free' && userPlan === 'free' || (minPlan === 'pro' && userPlan !== 'pro')) {
      navigate('/pricing');
      return;
    }
    await initializeOAuth(platformId);
  };

  if (!isOpen || !isAuthenticated) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
          <h2 className="text-xl font-semibold text-gray-900">Connect Accounts</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(100vh-180px)] overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl flex items-center gap-3 text-sm text-red-600 border border-red-100">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Connected Accounts */}
          {connectedAccounts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Connected Accounts</h3>
              <div className="space-y-3">
                {connectedAccounts.map((account) => {
                  const platform = PLATFORMS.find(p => p.id === account.platform.toLowerCase());
                  if (!platform) return null;
                  const Icon = platform.icon;
                  const isLoading = loadingStates[platform.id];

                  return (
                    <div key={account.id} 
                      className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 
                        hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${platform.bgColor} ring-4 ring-${platform.bgColor}/30`}>
                          <Icon className={`w-5 h-5 ${platform.color}`} />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{account.username}</span>
                          <p className="text-sm text-gray-500">Connected</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDisconnect(account.id, platform.id)}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 
                          rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Disconnecting...</span>
                          </>
                        ) : (
                          'Disconnect'
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Platforms */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Available Platforms</h3>
            <div className="space-y-3">
              {PLATFORMS.filter(platform => 
                !connectedAccounts.some(account => account.platform.toLowerCase() === platform.id)
              ).map((platform) => {
                const Icon = platform.icon;
                const isLocked = (platform.minPlan === 'basic' && userPlan === 'free') ||
                               (platform.minPlan === 'pro' && userPlan !== 'pro');
                const isLoading = loadingStates[platform.id];

                return (
                  <button
                    key={platform.id}
                    onClick={() => handleConnect(platform.id, platform.minPlan)}
                    disabled={isLoading || isLocked}
                    className={`w-full text-left flex items-center justify-between p-4 rounded-xl border
                      ${isLocked 
                        ? 'bg-gray-50 border-gray-200 cursor-not-allowed' 
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'} 
                      transition-all duration-200 group`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${platform.bgColor} group-hover:ring-4 ring-${platform.bgColor}/30 transition-all`}>
                        <Icon className={`w-5 h-5 ${platform.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{platform.name}</span>
                          {platform.minPlan !== 'free' && <PlanBadge plan={platform.minPlan as 'basic' | 'pro'} />}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{platform.benefit}</p>
                      </div>
                    </div>
                    {isLocked ? (
                      <Lock className="w-5 h-5 text-gray-400" />
                    ) : isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    ) : (
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 
                        group-hover:bg-blue-100 transition-colors">
                        <ChevronRight className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {userPlan !== 'pro' && (
            <button
              onClick={() => navigate('/pricing')}
              className="mt-6 w-full p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white 
                rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-md
                flex items-center justify-center gap-3 group"
            >
              <Crown className="w-5 h-5" />
              <span className="font-medium">Upgrade to unlock all platforms</span>
              <ChevronRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}