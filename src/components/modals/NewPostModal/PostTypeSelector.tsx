import React from 'react';
import { 
  Image, 
  Film, 
  MessageCircle, 
  Layout, 
  FileText, 
  BarChart2, 
  Calendar,
  ChevronLeft,
  Lock,
  Info
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
    name: 'Single Post',
    icon: Image,
    description: 'Share a photo or video with your audience',
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
    id: 'carousel',
    name: 'Carousel',
    icon: Layout,
    description: 'Share multiple photos or videos in a single post',
    platforms: ['instagram', 'linkedin']
  },
  {
    id: 'reel',
    name: 'Reel/Short Video',
    icon: Film,
    description: 'Create engaging short-form vertical videos',
    platforms: ['instagram', 'facebook'],
    premium: true
  },
  {
    id: 'thread',
    name: 'Thread',
    icon: MessageCircle,
    description: 'Create a series of connected posts',
    platforms: ['twitter', 'instagram']
  },
  {
    id: 'article',
    name: 'Article',
    icon: FileText,
    description: 'Share long-form content with rich formatting',
    platforms: ['linkedin'],
    premium: true
  },
  {
    id: 'poll',
    name: 'Poll',
    icon: BarChart2,
    description: 'Create interactive polls to engage your audience',
    platforms: ['twitter', 'instagram', 'linkedin']
  },
  {
    id: 'event',
    name: 'Event',
    icon: Calendar,
    description: 'Create and promote upcoming events',
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
      <div className="flex items-center space-x-4 mb-2">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </button>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Select Content Type
          </h3>
          <p className="text-sm text-gray-500">
            Choose the type of content you want to create
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availablePostTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          const supportedPlatforms = type.platforms.filter(platform =>
            selectedPlatforms.includes(platform)
          );

          return (
            <button
              key={type.id}
              onClick={() => !type.premium && onTypeSelect(type.id)}
              className={`relative p-4 rounded-xl text-left transition-all duration-200 ${
                isSelected
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : type.premium
                  ? 'border-2 border-gray-100 opacity-75 cursor-not-allowed'
                  : 'border-2 border-gray-100 hover:border-gray-300 hover:bg-gray-50'
              }`}
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
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">
                        {type.name}
                      </h4>
                      {type.premium && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          <Lock className="w-3 h-3 mr-1" />
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {type.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {supportedPlatforms.map(platform => (
                  <span
                    key={platform}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      isSelected
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {platform}
                  </span>
                ))}
              </div>

              {type.premium && (
                <div className="absolute top-2 right-2">
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400" />
                    <div className="absolute right-0 mt-2 w-48 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      This feature is available in premium plans
                    </div>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {availablePostTypes.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <Layout className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No available post types
          </h3>
          <p className="text-gray-500">
            The selected platforms don't have any matching post types
          </p>
        </div>
      )}
    </div>
  );
}