import React from 'react';
import { BASIC_PLATFORMS, PRO_PLATFORMS, PLATFORM_NAMES } from '../../../types/plans';
import { getPlatformIcon, PLATFORM_COLORS } from '../../../utils/platformUtils';

interface SocialAccount {
  id: string;
  platform?: string;
  username?: string;
  profileUrl?: string;
}

interface SocialConnectBannerProps {
  onConnect: () => void;
  socialAccounts: SocialAccount[];
  userPlan: 'trial' | 'basic' | 'pro';
}

export default function SocialConnectBanner({
  onConnect,
  socialAccounts = [],
  userPlan
}: SocialConnectBannerProps) {
  const availablePlatforms = userPlan === 'pro' 
    ? [...BASIC_PLATFORMS, ...PRO_PLATFORMS]
    : BASIC_PLATFORMS;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <h2 className="text-2xl font-bold mb-2">
            Connect Your Social Media Accounts
          </h2>
          <p className="text-blue-100">
            Link your social media accounts to start scheduling posts and
            tracking analytics
          </p>
        </div>
        <button
          onClick={onConnect}
          className="px-6 py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
        >
          Connect Accounts
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {availablePlatforms.map((platform) => {
          const account = socialAccounts.find(
            (acc) =>
              acc.platform &&
              acc.platform.toLowerCase() === platform.toLowerCase()
          );
          const icon = getPlatformIcon(platform);
          const colors = PLATFORM_COLORS[platform];
          const isProPlatform = PRO_PLATFORMS.includes(platform as any);
          const isLocked = isProPlatform && userPlan !== 'pro';

          return (
            <div
              key={platform}
              className={`flex items-center space-x-3 bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm ${
                isLocked ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
                  {icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {PLATFORM_NAMES[platform]}
                    </p>
                    {isProPlatform && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                        PRO
                      </span>
                    )}
                  </div>
                  {account?.username && (
                    <p className="text-sm text-blue-100 truncate">
                      @{account.username}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    account ? 'bg-green-400' : isLocked ? 'bg-yellow-400' : 'bg-gray-300'
                  }`}
                />
                <span className="text-sm">
                  {account 
                    ? 'Connected' 
                    : isLocked 
                      ? 'Pro Only' 
                      : 'Not Connected'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
