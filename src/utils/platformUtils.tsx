import React from 'react';
import { Instagram, Facebook, Twitter, Linkedin, Youtube } from 'lucide-react';

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
    default:
      return null;
  }
}