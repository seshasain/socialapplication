import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Loader2, CheckCircle2, LockIcon } from 'lucide-react';
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
        className={`flex items-center justify-between p-3 bg-white rounded-lg border
          ${isLocked ? 'opacity-60' : ''} 
          ${account ? 'border-green-100' : 'border-gray-100'}
          transition-all duration-200`}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{PLATFORM_NAMES[platform]}</span>
              {isProPlatform && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                  PRO
                </span>
              )}
            </div>
            {account?.username && (
              <p className="text-xs text-gray-500">@{account.username}</p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center space-x-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">
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
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200
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
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-white rounded-lg shadow-xl">
          <div className="p-4 border-b border-gray-100">
            <Dialog.Title className="text-base font-semibold text-gray-900">
              Connect Social Media Accounts
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-gray-500">
              Link your accounts to start scheduling posts
            </Dialog.Description>
          </div>

          <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
            {/* Basic Platforms */}
            <div>
              <h3 className="text-xs font-medium text-gray-900 mb-2">Basic Platforms</h3>
              <div className="space-y-2">
                {BASIC_PLATFORMS.map(renderPlatformCard)}
              </div>
            </div>

            {/* Pro Platforms */}
            <div>
              <h3 className="text-xs font-medium text-gray-900 mb-2">Pro Platforms</h3>
              <div className="space-y-2">
                {PRO_PLATFORMS.map(renderPlatformCard)}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}