import React from 'react';
import { Globe } from 'lucide-react';
import { getPlatformIcon } from '../../../utils/platformUtils';

interface PlatformSelectorProps {
  platforms: Array<{ id: string; name: string }>;
  selectedPlatforms: string[];
  onPlatformSelect: (platformId: string) => void;
  isPlatformSelected: (platformId: string) => boolean;
}

export default function PlatformSelector({
  platforms,
  selectedPlatforms,
  onPlatformSelect,
  isPlatformSelected,
}: PlatformSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Platforms
      </label>
      <div className="grid grid-cols-3 gap-2">
        {platforms.map((platform) => (
          <button
            key={platform.id}
            type="button"
            onClick={() => onPlatformSelect(platform.id)}
            className={`flex items-center justify-center p-3 rounded-lg border ${
              isPlatformSelected(platform.id)
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            } transition-colors`}
          >
            {platform.id === 'all' ? (
              <Globe className="w-5 h-5 mr-2" />
            ) : (
              getPlatformIcon(platform.id, "w-5 h-5 mr-2")
            )}
            <span className="text-sm font-medium">{platform.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}