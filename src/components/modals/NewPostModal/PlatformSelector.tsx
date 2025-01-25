import React from 'react';
import { ChevronRight } from 'lucide-react';
import { BASIC_PLATFORMS, PRO_PLATFORMS, PLATFORM_NAMES, SocialPlatform } from '../../../types/plans';
import { getPlatformIcon, PLATFORM_COLORS } from '../../../utils/platformUtils';

interface PlatformSelectorProps {
  userPlan: 'trial' | 'basic' | 'pro';
  selectedPlatforms: SocialPlatform[];
  onPlatformSelect: (platform: SocialPlatform) => void;
  onNext: () => void;
  connectedPlatforms: SocialPlatform[];
}

export default function PlatformSelector({
  userPlan,
  selectedPlatforms,
  onPlatformSelect,
  onNext,
  connectedPlatforms
}: PlatformSelectorProps) {
  const availablePlatforms = userPlan === 'pro' 
    ? [...BASIC_PLATFORMS, ...PRO_PLATFORMS]
    : BASIC_PLATFORMS;

  const renderPlatform = (platform: SocialPlatform) => {
    const icon = getPlatformIcon(platform);
    const colors = PLATFORM_COLORS[platform];
    const isConnected = connectedPlatforms.includes(platform);
    const isSelected = selectedPlatforms.includes(platform);
    const isProPlatform = PRO_PLATFORMS.includes(platform as any);
    const isLocked = isProPlatform && userPlan !== 'pro';

    return (
      <button
        key={platform}
        onClick={() => !isLocked && isConnected && onPlatformSelect(platform)}
        disabled={isLocked || !isConnected}
        className={`
          w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200
          ${isSelected 
            ? 'border-blue-500 bg-blue-50' 
            : isLocked
              ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
              : !isConnected
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
          }
        `}
      >
        <div className="flex items-center space-x-3">
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
            <span className="text-sm text-gray-500">
              {isLocked 
                ? 'Upgrade to Pro'
                : !isConnected
                  ? 'Not Connected'
                  : isSelected
                    ? 'Selected'
                    : 'Click to select'}
            </span>
          </div>
        </div>
        {!isLocked && isConnected && (
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
            ${isSelected 
              ? 'border-blue-500 bg-blue-500 text-white'
              : 'border-gray-300'
            }`}
          >
            {isSelected && (
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path
                  d="M10 3L4.5 8.5L2 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          Select Platforms
        </h3>
        <p className="text-sm text-gray-500">
          Choose the social media platforms where you want to publish your content
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Platforms</h4>
          <div className="space-y-2">
            {BASIC_PLATFORMS.map(renderPlatform)}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Pro Platforms</h4>
          <div className="space-y-2">
            {PRO_PLATFORMS.map(renderPlatform)}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={selectedPlatforms.length === 0}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="ml-2 -mr-1 h-4 w-4" />
        </button>
      </div>
    </div>
  );
}