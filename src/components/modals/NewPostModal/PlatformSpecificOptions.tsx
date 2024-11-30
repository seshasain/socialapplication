import React from 'react';
import { Instagram, Facebook, Twitter, Linkedin } from 'lucide-react';
import type { PostType } from './index';
import InstagramOptions from './options/InstagramOptions';
import FacebookOptions from './options/FacebookOptions';
import TwitterOptions from './options/TwitterOptions';
import LinkedInOptions from './options/LinkedInOptions';
interface PlatformSpecificOptionsProps {
  platform: string;
  postType: PostType;
  data: any;
  onChange: (data: any) => void;
}

export default function PlatformSpecificOptions({
  platform,
  postType,
  data = {},
  onChange
}: PlatformSpecificOptionsProps) {
  const renderPlatformIcon = () => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-600" />;
      case 'facebook':
        return <Facebook className="w-5 h-5 text-blue-600" />;
      case 'twitter':
        return <Twitter className="w-5 h-5 text-sky-500" />;
      case 'linkedin':
        return <Linkedin className="w-5 h-5 text-blue-700" />;
      default:
        return null;
    }
  };

  const renderOptions = () => {
    switch (platform) {
      case 'instagram':
        return <InstagramOptions postType={postType} data={data} onChange={onChange} />;
      case 'facebook':
        return <FacebookOptions postType={postType} data={data} onChange={onChange} />;
      case 'twitter':
        return <TwitterOptions postType={postType} data={data} onChange={onChange} />;
      case 'linkedin':
        return <LinkedInOptions postType={postType} data={data} onChange={onChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
      <div className="flex items-center space-x-2 mb-4">
        {renderPlatformIcon()}
        <h3 className="text-lg font-medium text-gray-900">
          {platform.charAt(0).toUpperCase() + platform.slice(1)} Options
        </h3>
      </div>
      {renderOptions()}
    </div>
  );
}