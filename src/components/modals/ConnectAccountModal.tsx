import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { Loader2, CheckCircle2, Calendar, BarChart2, Users, Zap } from 'lucide-react';
import { BASIC_PLATFORMS, PRO_PLATFORMS, PLATFORM_NAMES, SocialPlatform } from '../../types/plans';
import { getPlatformIcon, PLATFORM_COLORS } from '../../utils/platformUtils';
import { connectSocialAccount, disconnectSocialAccount } from '../../api/overview';
import toast from 'react-hot-toast';

interface ConnectAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  socialAccounts: Array<{
    id: string;
    platform: string;
    username?: string;
  }>;
  onAccountConnect: (platform: string) => Promise<void>;
  onAccountDisconnect: (accountId: string) => Promise<void>;
  userPlan: 'trial' | 'basic' | 'pro';
}

export default function ConnectAccountModal({
  isOpen,
  onClose,
  socialAccounts,
  onAccountConnect,
  onAccountDisconnect,
  userPlan
}: ConnectAccountModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const callbackHandled = useRef(false);

  // Log modal renders
  console.log('ConnectAccountModal rendering:', {
    isOpen,
    loading,
    socialAccountsCount: socialAccounts.length
  });

  // Handle OAuth callback
  useEffect(() => {
    if (!isOpen) return;
    
    console.log('ConnectAccountModal: Modal is open, checking URL params');
    const params = new URLSearchParams(window.location.search);
    const platform = params.get('platform');
    const status = params.get('status');
    
    console.log('ConnectAccountModal: URL params:', { platform, status });

    if (platform && status === 'connected') {
      console.log('ConnectAccountModal: Processing successful connection');
      const normalizedPlatform = platform.toLowerCase() as SocialPlatform;
      console.log('ConnectAccountModal: Showing success toast for platform:', normalizedPlatform);
      
      // Remove success message from state
      setSuccess(null);
      
      // Show toast notification
      toast.success(`Successfully connected to ${PLATFORM_NAMES[normalizedPlatform]}!`);
      console.log('ConnectAccountModal: Toast called');
      
      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);
      console.log('ConnectAccountModal: URL params cleared');
      
      // Update connected accounts
      onAccountConnect(platform);
      console.log('ConnectAccountModal: Account connect callback called');
    } else if (platform && status === 'error') {
      console.log('ConnectAccountModal: Processing connection error');
      const normalizedPlatform = platform.toLowerCase() as SocialPlatform;
      
      // Remove error message from state
      setError(null);
      
      // Show toast notification
      toast.error(`Failed to connect to ${PLATFORM_NAMES[normalizedPlatform]}. Please try again.`);
      console.log('ConnectAccountModal: Error toast called');
      
      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);
      console.log('ConnectAccountModal: URL params cleared');
    }
  }, [isOpen, onAccountConnect]);

  // Reset callback handled flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      console.log('Modal closed, clearing messages');
      callbackHandled.current = false;
    }
  }, [isOpen]);

  // Clear messages when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSuccess(null);
      setLoading(null);
    }
  }, [isOpen]);

  const handleConnect = async (platform: string) => {
    console.log('Connect requested for platform:', platform);
    
    // Don't proceed if already loading
    if (loading) {
      console.log('Connection already in progress, skipping');
      return;
    }

    setLoading(platform);
    setError(null);
    setSuccess(null);

    try {
      console.log('Initiating connection for:', platform);
      const normalizedPlatform = platform.toLowerCase();
      await connectSocialAccount(normalizedPlatform);
      console.log('Connection initiated successfully');
    } catch (err) {
      console.error('Connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect account');
    } finally {
      setLoading(null);
    }
  };

  const handleDisconnect = async (accountId: string, platform: SocialPlatform) => {
    console.log('Disconnect requested for:', { accountId, platform });
    
    // Don't proceed if already loading
    if (loading) {
      console.log('Disconnect already in progress, skipping');
      return;
    }

    setLoading(platform);
    setError(null);
    try {
      console.log('Initiating disconnect');
      const response = await disconnectSocialAccount(accountId);
      console.log('Disconnect response:', response);

      if (response.success) {
        console.log('Disconnect successful, updating UI');
        await onAccountDisconnect(accountId);
        setSuccess(`Successfully disconnected from ${PLATFORM_NAMES[platform]}`);
      } else {
        console.error('Disconnect failed:', response);
        throw new Error(response.error || 'Failed to disconnect account');
      }
    } catch (err) {
      console.error('Disconnect error:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect account');
    } finally {
      setLoading(null);
    }
  };

  const renderPlatformCard = (platform: SocialPlatform) => {
    const account = socialAccounts.find(
      acc => acc.platform.toLowerCase() === platform.toLowerCase()
    );
    const icon = getPlatformIcon(platform);
    const colors = PLATFORM_COLORS[platform];
    const isProPlatform = PRO_PLATFORMS.includes(platform as any);
    const isLocked = isProPlatform && userPlan !== 'pro';
    const isLoading = loading === platform;

    return (
      <div
        key={platform}
        className={`flex items-center justify-between p-3 bg-white rounded-xl border
          ${isLocked ? 'opacity-60' : ''} 
          ${account ? 'border-green-100 bg-green-50/30' : 'border-gray-100 hover:border-gray-200'} 
          transition-all duration-200 group hover:shadow-sm`}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-9 h-9 flex items-center justify-center rounded-lg ${colors.bg} ${colors.text} transform group-hover:scale-110 transition-transform duration-200`}>
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-900">{PLATFORM_NAMES[platform]}</span>
              {isProPlatform && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full">
                  PRO
                </span>
              )}
            </div>
            {account?.username && (
              <p className="text-xs text-gray-500 mt-0.5">@{account.username}</p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center space-x-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs font-medium">
              {account ? 'Disconnecting...' : 'Connecting...'}
            </span>
          </div>
        ) : (
          <button
            onClick={() => {
              if (account) {
                handleDisconnect(account.id, platform);
              } else if (!isLocked) {
                handleConnect(platform);
              }
            }}
            disabled={isLocked && !account}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
              ${account
                ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                : isLocked
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
          >
            {account 
              ? 'Disconnect' 
              : isLocked 
                ? 'Pro Only'
                : 'Connect'}
          </button>
        )}
      </div>
    );
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-white rounded-xl shadow-xl">
          <div className="p-6 border-b border-gray-100">
            <Dialog.Title className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Connect Your Social Media Accounts
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-gray-600 leading-relaxed">
              Link your accounts to unlock powerful features:
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="flex items-start space-x-2">
                  <Calendar className="w-4 h-4 text-blue-500 mt-0.5" />
                  <span className="text-sm text-gray-600">Schedule posts ahead</span>
                </div>
                <div className="flex items-start space-x-2">
                  <BarChart2 className="w-4 h-4 text-blue-500 mt-0.5" />
                  <span className="text-sm text-gray-600">Track analytics</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Users className="w-4 h-4 text-blue-500 mt-0.5" />
                  <span className="text-sm text-gray-600">Grow audience</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Zap className="w-4 h-4 text-blue-500 mt-0.5" />
                  <span className="text-sm text-gray-600">Boost engagement</span>
                </div>
              </div>
            </Dialog.Description>
          </div>

          {error && (
            <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mx-5 mt-4 p-3 bg-green-50 border border-green-100 text-green-600 text-sm rounded-lg flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              <span>{success}</span>
            </div>
          )}

          <div className="p-5 max-h-[60vh] overflow-y-auto space-y-5">
            {/* Basic Platforms */}
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">Basic Platforms</h3>
              <div className="space-y-2.5">
                {BASIC_PLATFORMS.map(renderPlatformCard)}
              </div>
            </div>

            {/* Pro Platforms */}
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">Pro Platforms</h3>
              <div className="space-y-2.5">
                {PRO_PLATFORMS.map(renderPlatformCard)}
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-gray-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}