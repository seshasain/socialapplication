import React from 'react';
import { Instagram, Facebook, Twitter, Linkedin, Youtube, Globe, ChevronRight } from 'lucide-react';

interface PlatformSelectorProps {
  platforms: Array<{ id: string; platform: string }>;
  selectedPlatforms: string[];
  onPlatformSelect: (platformId: string) => void;
  onNext: () => void;
}

export default function PlatformSelector({
  platforms,
  selectedPlatforms,
  onPlatformSelect,
  onNext
}: PlatformSelectorProps) {
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-6 h-6 text-pink-500" />;
      case 'facebook':
        return <Facebook className="w-6 h-6 text-blue-600" />;
      case 'twitter':
        return <Twitter className="w-6 h-6 text-sky-500" />;
      case 'linkedin':
        return <Linkedin className="w-6 h-6 text-blue-700" />;
      case 'youtube':
        return <Youtube className="w-6 h-6 text-red-600" />;
      default:
        return <Globe className="w-6 h-6 text-gray-600" />;
    }
  };

  const getPlatformGradient = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 'from-pink-500 to-purple-500';
      case 'facebook':
        return 'from-blue-600 to-blue-700';
      case 'twitter':
        return 'from-sky-400 to-sky-600';
      case 'linkedin':
        return 'from-blue-600 to-blue-800';
      case 'youtube':
        return 'from-red-500 to-red-700';
      default:
        return 'from-gray-500 to-gray-700';
    }
  };

  const handleSelectAll = () => {
    const allSelected = platforms.every(p => selectedPlatforms.includes(p.id));
    if (allSelected) {
      // Deselect all
      platforms.forEach(p => onPlatformSelect(p.id));
    } else {
      // Select all
      platforms.forEach(p => {
        if (!selectedPlatforms.includes(p.id)) {
          onPlatformSelect(p.id);
        }
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Select Platforms
        </h3>
        <p className="text-gray-600">
          Choose where you want to publish your content
        </p>
      </div>

      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <button
            onClick={handleSelectAll}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Globe className="w-4 h-4" />
            <span>
              {platforms.every(p => selectedPlatforms.includes(p.id))
                ? 'Deselect All Platforms'
                : 'Select All Platforms'}
            </span>
          </button>
          
          <span className="text-sm text-gray-500">
            {selectedPlatforms.length} of {platforms.length} selected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((platform) => {
            const isSelected = selectedPlatforms.includes(platform.id);
            const gradient = getPlatformGradient(platform.platform);

            return (
              <button
                key={platform.id}
                onClick={() => onPlatformSelect(platform.id)}
                className={`relative group p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`p-3 rounded-xl ${
                      isSelected ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-gray-200'
                    } transition-colors`}
                  >
                    {getPlatformIcon(platform.platform)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {platform.platform}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {isSelected ? 'Selected' : 'Click to select'}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 group-hover:border-gray-400'
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-full h-full text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-lg">
                  <div
                    className={`h-full w-full bg-gradient-to-r ${gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={onNext}
          disabled={selectedPlatforms.length === 0}
          className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
            selectedPlatforms.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
          }`}
        >
          Next Step
          <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
}