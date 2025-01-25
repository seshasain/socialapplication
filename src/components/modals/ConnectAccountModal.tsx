import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Loader2 } from 'lucide-react';
import { BASIC_PLATFORMS, PRO_PLATFORMS, PLATFORM_NAMES, SocialPlatform } from '../../types/plans';
import { getPlatformIcon, PLATFORM_COLORS } from '../../utils/platformUtils';

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

  const handleConnect = async (platform: string) => {
    setLoading(platform);
    try {
      await onAccountConnect(platform);
    } finally {
      setLoading(null);
    }
  };

  const handleDisconnect = async (accountId: string, platform: string) => {
    setLoading(platform);
    try {
      await onAccountDisconnect(accountId);
    } finally {
      setLoading(null);
    }
  };

  const renderPlatformSection = (title: string, platforms: SocialPlatform[]) => (
    <div>
      <h3 className="text-sm font-medium text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {platforms.map((platform) => {
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
              className={`flex items-center justify-between p-4 bg-white rounded-xl border
                ${isLocked ? 'opacity-50' : ''} 
                ${account ? 'border-green-100' : 'border-gray-200'}
                transition-all duration-200`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
                  {icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{PLATFORM_NAMES[platform]}</span>
                    {isProPlatform && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                        PRO
                      </span>
                    )}
                  </div>
                  {account?.username && (
                    <p className="text-sm text-gray-500">@{account.username}</p>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center space-x-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">
                    {account ? 'Disconnecting...' : 'Connecting...'}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => account 
                    ? handleDisconnect(account.id, platform)
                    : !isLocked && handleConnect(platform)
                  }
                  disabled={isLocked && !account}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${account
                      ? 'text-red-600 hover:bg-red-50'
                      : isLocked
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-blue-600 hover:bg-blue-50'
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
        })}
      </div>
    </div>
  );

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      {/* The backdrop, rendered as a fixed sibling to the panel container */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl bg-white rounded-xl shadow-xl p-6">
          <Dialog.Title className="text-lg font-semibold text-gray-900 mb-1">
            Connect Social Media Accounts
          </Dialog.Title>
          <Dialog.Description className="text-gray-500 mb-6">
            Link your social media accounts to start scheduling posts
          </Dialog.Description>

          <div className="space-y-6">
            {renderPlatformSection('Basic Platforms', BASIC_PLATFORMS)}
            {renderPlatformSection('Pro Platforms', PRO_PLATFORMS)}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}