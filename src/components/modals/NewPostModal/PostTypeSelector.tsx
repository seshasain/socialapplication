import React, { useEffect } from 'react';
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
  Sparkles,
  Instagram,
  Facebook,
  Twitter,
  Linkedin
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
  // Debug: Log initial props
  useEffect(() => {
    console.log('PostTypeSelector Props:', {
      selectedPlatforms,
      selectedType
    });
  }, [selectedPlatforms, selectedType]);

  // Convert selected platforms to lowercase for comparison
  const normalizedSelectedPlatforms = selectedPlatforms.map(p => p.toLowerCase());
  console.log('Normalized Selected Platforms:', normalizedSelectedPlatforms);

  // Define common post types available across platforms
  const commonPostTypes: PostTypeOption[] = [
    {
      id: 'post',
      name: 'Regular Post',
      icon: Image,
      description: 'Share photos, videos, or text updates with your audience',
      platforms: ['instagram', 'facebook', 'twitter', 'linkedin'],
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      id: 'carousel',
      name: 'Carousel',
      icon: Layout,
      description: 'Multiple photos or videos in a single post',
      platforms: ['instagram', 'linkedin'],
      gradient: 'from-indigo-500 to-blue-600'
    }
  ];

  // Define platform-specific post types
  const platformSpecificTypes: Record<string, PostTypeOption[]> = {
    instagram: [
      {
        id: 'story',
        name: 'Story',
        icon: Layout,
        description: '24-hour temporary content with interactive elements',
        platforms: ['instagram'],
        gradient: 'from-purple-500 to-pink-500'
      },
      {
        id: 'reel',
        name: 'Reel',
        icon: Film,
        description: 'Short-form vertical videos with music and effects',
        platforms: ['instagram'],
        premium: true,
        gradient: 'from-orange-500 to-pink-500'
      }
    ],
    facebook: [
      {
        id: 'story',
        name: 'Story',
        icon: Layout,
        description: '24-hour temporary content with interactive elements',
        platforms: ['facebook'],
        gradient: 'from-blue-400 to-blue-600'
      },
      {
        id: 'reel',
        name: 'Reel',
        icon: Film,
        description: 'Short-form vertical videos with music and effects',
        platforms: ['facebook'],
        premium: true,
        gradient: 'from-blue-500 to-blue-700'
      }
    ],
    twitter: [
      {
        id: 'thread',
        name: 'Thread',
        icon: MessageCircle,
        description: 'Connected series of posts for longer narratives',
        platforms: ['twitter'],
        gradient: 'from-blue-400 to-blue-500'
      },
      {
        id: 'poll',
        name: 'Poll',
        icon: BarChart2,
        description: 'Interactive polls to engage with your audience',
        platforms: ['twitter'],
        gradient: 'from-blue-500 to-blue-600'
      }
    ],
    linkedin: [
      {
        id: 'article',
        name: 'Article',
        icon: FileText,
        description: 'Long-form content with rich formatting',
        platforms: ['linkedin'],
        premium: true,
        gradient: 'from-blue-600 to-blue-700'
      },
      {
        id: 'event',
        name: 'Event',
        icon: Calendar,
        description: 'Create and promote events',
        platforms: ['linkedin'],
        premium: true,
        gradient: 'from-blue-700 to-blue-800'
      }
    ]
  };

  // Filter common post types based on selected platforms
  const availableCommonTypes = commonPostTypes.filter(type =>
    type.platforms.some(platform => 
      normalizedSelectedPlatforms.includes(platform.toLowerCase())
    )
  );
  console.log('Available Common Types:', availableCommonTypes);

  // Get platform-specific types for selected platforms
  const availablePlatformTypes = normalizedSelectedPlatforms.reduce((acc, platform) => {
    if (platformSpecificTypes[platform]) {
      acc[platform] = platformSpecificTypes[platform];
    }
    return acc;
  }, {} as Record<string, PostTypeOption[]>);
  console.log('Available Platform Types:', availablePlatformTypes);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-500" />;
      case 'facebook':
        return <Facebook className="w-5 h-5 text-blue-600" />;
      case 'twitter':
        return <Twitter className="w-5 h-5 text-blue-400" />;
      case 'linkedin':
        return <Linkedin className="w-5 h-5 text-blue-700" />;
      default:
        return null;
    }
  };

  const renderPostTypeCard = (type: PostTypeOption) => {
    console.log('Rendering Post Type Card:', type);
    return (
      <button
        key={type.id}
        onClick={() => {
          console.log('Post Type Selected:', type.id);
          if (!type.premium) {
            onTypeSelect(type.id);
          }
        }}
        className={`relative group p-6 rounded-xl text-left transition-all duration-300 transform hover:-translate-y-1 ${
          type.premium
            ? 'cursor-not-allowed bg-gray-50'
            : selectedType === type.id
            ? 'bg-blue-50 border-2 border-blue-500 shadow-lg'
            : 'bg-white border-2 border-gray-100 hover:border-gray-200 hover:shadow-lg'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`p-3 rounded-xl ${
                selectedType === type.id
                  ? 'bg-blue-100'
                  : type.premium
                  ? 'bg-gray-100'
                  : 'bg-gray-100 group-hover:bg-gray-200'
              } transition-colors`}
            >
              <type.icon className={`w-6 h-6 ${
                selectedType === type.id
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
                    <Lock className="w-3 h-3 mr-1" />
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
  };

  // Debug: Log render state
  useEffect(() => {
    console.log('PostTypeSelector Render State:', {
      availableCommonTypes: availableCommonTypes.length,
      platformTypesCount: Object.keys(availablePlatformTypes).length
    });
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => {
            console.log('Back button clicked');
            onBack();
          }}
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

      {/* Common Post Types Section */}
      {availableCommonTypes.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Common Post Types</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableCommonTypes.map(renderPostTypeCard)}
          </div>
        </div>
      )}

      {/* Platform-Specific Post Types Section */}
      {Object.entries(availablePlatformTypes).map(([platform, types]) => (
        <div key={platform} className="space-y-4">
          <h4 className="flex items-center text-sm font-medium text-gray-700">
            {getPlatformIcon(platform)}
            <span className="ml-2">{platform.charAt(0).toUpperCase() + platform.slice(1)} Specific</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {types.map(renderPostTypeCard)}
          </div>
        </div>
      ))}
    </div>
  );
}