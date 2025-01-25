import React from 'react';
import { Instagram, Facebook, Twitter, Linkedin, Youtube, MessageCircle, PinIcon, TrendingUp } from 'lucide-react';
import { SocialPlatform, PLATFORM_NAMES } from '../types/plans';

export function getPlatformIcon(platform: string, className: string = "w-5 h-5") {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return <Instagram className={className} />;
    case 'facebook':
      return <Facebook className={className} />;
    case 'twitter':
      return <Twitter className={className} />;
    case 'linkedin':
      return <Linkedin className={className} />;
    case 'youtube':
      return <Youtube className={className} />;
    case 'threads':
      return <MessageCircle className={className} />;
    case 'pinterest':
      return <PinIcon className={className} />;
    case 'tiktok':
      return <TrendingUp className={className} />;
    default:
      return null;
  }
}

export function getPlatformName(platform: SocialPlatform): string {
  return PLATFORM_NAMES[platform];
}

export const PLATFORM_COLORS: Record<SocialPlatform, { bg: string; text: string }> = {
  facebook: { bg: 'bg-blue-100', text: 'text-blue-600' },
  instagram: { bg: 'bg-pink-100', text: 'text-pink-600' },
  threads: { bg: 'bg-gray-100', text: 'text-gray-600' },
  linkedin: { bg: 'bg-blue-100', text: 'text-blue-700' },
  twitter: { bg: 'bg-sky-100', text: 'text-sky-500' },
  youtube: { bg: 'bg-red-100', text: 'text-red-600' },
  pinterest: { bg: 'bg-red-100', text: 'text-red-500' },
  tiktok: { bg: 'bg-gray-100', text: 'text-gray-900' }
};