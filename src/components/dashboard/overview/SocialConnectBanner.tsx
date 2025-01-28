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
    <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-xl p-6 text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f46e5_1px,transparent_1px),linear-gradient(to_bottom,#4f46e5_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-10 animate-[grid-shimmer_30s_linear_infinite]" />
      
      <div className="relative">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-6">
          <div className="flex-1 space-y-2">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              Connect Your Social Media Accounts
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed max-w-xl">
              Link your accounts to start scheduling posts and tracking analytics
            </p>
          </div>
          <div className="flex items-center gap-4 self-start">
            <div className="px-2.5 py-1 bg-white/10 rounded-full text-xs font-medium backdrop-blur-sm border border-white/10">
              {socialAccounts.length}/{availablePlatforms.length} Connected
            </div>
            <button
              onClick={onConnect}
              className="px-5 py-2.5 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 group text-sm relative overflow-hidden"
            >
              <span className="relative z-10">Connect Accounts</span>
              <svg className="w-4 h-4 transform transition-transform group-hover:translate-x-0.5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {availablePlatforms.map(platform => {
            const account = socialAccounts.find(
              acc => acc.platform && acc.platform.toLowerCase() === platform.toLowerCase()
            );
            const icon = getPlatformIcon(platform);
            const colors = PLATFORM_COLORS[platform];
            const isProPlatform = PRO_PLATFORMS.includes(platform as any);
            const isLocked = isProPlatform && userPlan !== 'pro';

            return (
              <div
                key={platform}
                className={`flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10 
                  ${isLocked ? 'opacity-75' : ''} 
                  transition-all duration-200 hover:bg-white/[0.15] group relative`}
              >
                {isLocked && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-sm">
                    Upgrade to Pro to unlock
                  </div>
                )}
                <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${colors.bg} ${colors.text} transform group-hover:scale-110 transition-transform duration-200 shadow-sm`}>
                  {icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium truncate text-white text-sm">
                      {PLATFORM_NAMES[platform]}
                    </p>
                    {isProPlatform && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full shadow-sm leading-none">
                        PRO
                      </span>
                    )}
                  </div>
                  {account?.username && (
                    <p className="text-xs text-blue-200 truncate">
                      @{account.username}
                    </p>
                  )}
                </div>
                <div className={`w-1.5 h-1.5 rounded-full shadow-sm flex-shrink-0 ${
                  account 
                    ? 'bg-emerald-400 shadow-emerald-400/50 animate-pulse' 
                    : isLocked 
                      ? 'bg-amber-400 shadow-amber-400/50' 
                      : 'bg-white/30'
                }`} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
