import React from 'react';
import { 
  Image, 
  Film, 
  MessageCircle, 
  Layout, 
  FileText, 
  BarChart2, 
  Calendar,
  ChevronRight,
  ChevronLeft,
  Lock
} from 'lucide-react';
import type { PostType } from './index';

interface PostTypeOption {
  id: PostType;
  name: string;
  icon: React.ElementType;
  description: string;
  platforms: string[];
  premium?: boolean;
}

const POST_TYPES: PostTypeOption[] = [
  {
    id: 'post',
    name: 'Regular Post',
    icon: Image,
    description: 'Share photos, videos, or text updates with your audience',
    platforms: ['instagram', 'facebook', 'twitter', 'linkedin']
  },
  {
    id: 'story',
    name: 'Story',
    icon: Layout,
    description: '24-hour temporary content with interactive elements',
    platforms: ['instagram', 'facebook']
  },
  {
    id: 'reel',
    name: 'Reel',
    icon: Film,
    description: 'Short-form vertical videos with music and effects',
    platforms: ['instagram', 'facebook'],
    premium: true
  },
  {
    id: 'thread',
    name: 'Thread',
    icon: MessageCircle,
    description: 'Connected series of posts for longer narratives',
    platforms: ['twitter', 'instagram']
  },
  {
    id: 'carousel',
    name: 'Carousel',
    icon: Layout,
    description: 'Multiple photos or videos in a single post',
    platforms: ['instagram', 'linkedin']
  },
  {
    id: 'article',
    name: 'Article',
    icon: FileText,
    description: 'Long-form content with rich formatting',
    platforms: ['linkedin'],
    premium: true
  },
  {
    id: 'poll',
    name: 'Poll',
    icon: BarChart2,
    description: 'Interactive polls to engage with your audience',
    platforms: ['twitter', 'instagram', 'linkedin']
  },
  {
    id: 'event',
    name: 'Event',
    icon: Calendar,
    description: 'Create and promote events',
    platforms: ['facebook', 'linkedin'],
    premium: true
  }
];

interface PostTypeSelectorProps {
  selectedPlatforms: string[];
  selectedType: PostType;
  onTypeSelect: (type: PostType) => void;
  onBack: () => void;
}

export default function PostTypeSelector({
  selectedPlatforms,
  selectedType,
  onTypeSelect,
  onBack
}: PostTypeSelectorProps) {
  // Filter post types based on selected platforms
  const availablePostTypes = POST_TYPES.filter(type =>
    type.platforms.some(platform => selectedPlatforms.includes(platform))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          Select Content Type
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availablePostTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          const supportedPlatforms = type.platforms.filter(platform =>
            selectedPlatforms.includes(platform)
          );

          return (
            <button
              key={type.id}
              onClick={() => onTypeSelect(type.id)}
              className={`relative p-4 rounded-xl text-left transition-all duration-200 ${
                isSelected
                  ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
                  : 'border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50'
              } ${type.premium ? 'cursor-not-allowed opacity-75' : ''}`}
              disabled={type.premium}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    isSelected ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      isSelected ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {type.name}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {type.description}
                    </p>
                  </div>
                </div>
                {type.premium && (
                  <Lock className="w-5 h-5 text-gray-400" />
                )}
              </div>

              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-2">
                  Available for:
                </div>
                <div className="flex flex-wrap gap-2">
                  {supportedPlatforms.map(platform => (
                    <span
                      key={platform}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </div>

              {type.premium && (
                <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-xl">
                  <span className="px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-full">
                    Premium Feature
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}