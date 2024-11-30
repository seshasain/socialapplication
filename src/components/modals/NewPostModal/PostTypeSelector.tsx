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
  Lock,
  Sparkles
} from 'lucide-react';
import type { PostType } from './index';

interface PostTypeOption {
  id: PostType;
  name: string;
  icon: React.ElementType;
  description: string;
  platforms: string[];
  premium?: boolean;
  gradient?: string;
}

const POST_TYPES: PostTypeOption[] = [
  {
    id: 'post',
    name: 'Regular Post',
    icon: Image,
    description: 'Share photos, videos, or text updates with your audience',
    platforms: ['instagram', 'facebook', 'twitter', 'linkedin'],
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'story',
    name: 'Story',
    icon: Layout,
    description: '24-hour temporary content with interactive elements',
    platforms: ['instagram', 'facebook'],
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'reel',
    name: 'Reel',
    icon: Film,
    description: 'Short-form vertical videos with music and effects',
    platforms: ['instagram', 'facebook'],
    premium: true,
    gradient: 'from-orange-500 to-pink-500'
  },
  {
    id: 'thread',
    name: 'Thread',
    icon: MessageCircle,
    description: 'Connected series of posts for longer narratives',
    platforms: ['twitter', 'instagram'],
    gradient: 'from-green-500 to-emerald-600'
  },
  {
    id: 'carousel',
    name: 'Carousel',
    icon: Layout,
    description: 'Multiple photos or videos in a single post',
    platforms: ['instagram', 'linkedin'],
    gradient: 'from-indigo-500 to-blue-600'
  },
  {
    id: 'article',
    name: 'Article',
    icon: FileText,
    description: 'Long-form content with rich formatting',
    platforms: ['linkedin'],
    premium: true,
    gradient: 'from-blue-600 to-indigo-600'
  },
  {
    id: 'poll',
    name: 'Poll',
    icon: BarChart2,
    description: 'Interactive polls to engage with your audience',
    platforms: ['twitter', 'instagram', 'linkedin'],
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'event',
    name: 'Event',
    icon: Calendar,
    description: 'Create and promote events',
    platforms: ['facebook', 'linkedin'],
    premium: true,
    gradient: 'from-purple-600 to-indigo-600'
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
  // Convert selected platforms to lowercase for comparison
  const normalizedSelectedPlatforms = selectedPlatforms.map(p => p.toLowerCase());
  
  // Filter post types based on selected platforms
  const availablePostTypes = POST_TYPES.filter(type =>
    type.platforms.some(platform => 
      normalizedSelectedPlatforms.includes(platform.toLowerCase())
    )
  );

  if (availablePostTypes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Layout className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Post Types</h3>
        <p className="text-gray-500 mb-6">
          The selected platforms don't have any compatible post types in common.
          Please select different platforms or go back to modify your selection.
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Select Different Platforms
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
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
          <p className="text-sm text-gray-500 mt-1">
            Choose the type of content you want to create
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availablePostTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;

          return (
            <button
              key={type.id}
              onClick={() => !type.premium && onTypeSelect(type.id)}
              className={`relative group p-6 rounded-xl text-left transition-all duration-300 transform hover:-translate-y-1 ${
                type.premium
                  ? 'cursor-not-allowed bg-gray-50'
                  : isSelected
                  ? 'bg-blue-50 border-2 border-blue-500 shadow-lg'
                  : 'bg-white border-2 border-gray-100 hover:border-gray-200 hover:shadow-lg'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-3 rounded-xl ${
                      isSelected
                        ? 'bg-blue-100'
                        : type.premium
                        ? 'bg-gray-100'
                        : 'bg-gray-100 group-hover:bg-gray-200'
                    } transition-colors`}
                  >
                    <Icon className={`w-6 h-6 ${
                      isSelected
                        ? 'text-blue-600'
                        : type.premium
                        ? 'text-gray-400'
                        : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h4 className={`font-medium ${
                        type.premium ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {type.name}
                      </h4>
                      {type.premium && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                           <Lock className="w-4 h-4 mr-1" />
                          Premium
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${
                      type.premium ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {type.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-2">
                  Available for:
                </div>
                <div className="flex flex-wrap gap-2">
                  {type.platforms.map(platform => (
                    <span
                      key={platform}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        normalizedSelectedPlatforms.includes(platform.toLowerCase())
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </div>

              {/* Gradient bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-lg">
                <div
                  className={`h-full w-full bg-gradient-to-r ${type.gradient || 'from-gray-400 to-gray-500'} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}
                />
              </div>

              {type.premium && (
                <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-xl">
                  <div className="text-center">
                    <Sparkles className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                    <span className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs font-medium rounded-full">
                      Premium Feature
                    </span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}