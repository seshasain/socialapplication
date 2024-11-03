import React from 'react';
import { Instagram, Facebook, Twitter, Linkedin, Youtube } from 'lucide-react';

interface SocialAccount {
  id: string;
  platform?: string;
}

interface SocialConnectBannerProps {
  onConnect: () => void;
  socialAccounts: SocialAccount[];
}

export default function SocialConnectBanner({ onConnect, socialAccounts = [] }: SocialConnectBannerProps) {
  const platforms = [
    { name: 'Instagram', icon: Instagram },
    { name: 'Facebook', icon: Facebook },
    { name: 'Twitter', icon: Twitter },
    { name: 'LinkedIn', icon: Linkedin },
    { name: 'YouTube', icon: Youtube },
    {
      name: 'TikTok',
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0011.14-4.02v-6.3a8.16 8.16 0 004.65 1.49v-3.39a4.85 4.85 0 01-1.2-1.19z"/>
        </svg>
      )
    }
  ];

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <h2 className="text-2xl font-bold mb-2">Connect Your Social Media Accounts</h2>
          <p className="text-blue-100">
            Link your social media accounts to start scheduling posts and tracking analytics
          </p>
        </div>
        <button
          onClick={onConnect}
          className="px-6 py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
        >
          Connect Accounts
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {platforms.map((platform) => {
          const account = socialAccounts.find(
            acc => acc.platform && acc.platform.toLowerCase() === platform.name.toLowerCase()
          );
          const Icon = platform.icon;
          return (
            <div
              key={platform.name}
              className="flex items-center space-x-3 bg-white bg-opacity-10 rounded-lg p-3 backdrop-blur-sm"
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium flex-1">{platform.name}</span>
              <div className={`w-2 h-2 rounded-full ${account ? 'bg-green-400' : 'bg-gray-300'}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}