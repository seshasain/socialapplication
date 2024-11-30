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
  Sparkles,
  Instagram,
  Facebook,
  Twitter,
  Linkedin
} from 'lucide-react';
import type { PostType } from './index';
import type { SocialAccount } from '../../../types/overview';

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
  // Common post types
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
  },
  
  // Instagram-specific
  {
    id: 'story',
    name: 'Instagram Story',
    icon: Layout,
    description: '24-hour temporary content with interactive elements',
    platforms: ['instagram'],
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'reel',
    name: 'Instagram Reel',
    icon: Film,
    description: 'Short-form vertical videos with music and effects',
    platforms: ['instagram'],
    premium: true,
    gradient: 'from-orange-500 to-pink-500'
  },
  
  // Facebook-specific
  {
    id: 'fb_story',
    name: 'Facebook Story',
    icon: Layout,
    description: '24-hour temporary content for Facebook',
    platforms: ['facebook'],
    gradient: 'from-blue-400 to-blue-600'
  },
  {
    id: 'fb_reel',
    name: 'Facebook Reel',
    icon: Film,
    description: 'Short videos optimized for Facebook',
    platforms: ['facebook'],
    premium: true,
    gradient: 'from-blue-500 to-blue-700'
  },
  
  // Twitter-specific
  {
    id: 'thread',
    name: 'Twitter Thread',
    icon: MessageCircle,
    description: 'Connected series of tweets for longer narratives',
    platforms: ['twitter'],
    gradient: 'from-blue-400 to-blue-500'
  },
  {
    id: 'poll',
    name: 'Twitter Poll',
    icon: BarChart2,
    description: 'Interactive polls to engage with your audience',
    platforms: ['twitter'],
    gradient: 'from-blue-500 to-blue-600'
  },
  
  // LinkedIn-specific
  {
    id: 'article',
    name: 'LinkedIn Article',
    icon: FileText,
    description: 'Long-form content with rich formatting',
    platforms: ['linkedin'],
    premium: true,
    gradient: 'from-blue-600 to-indigo-600'
  },
  {
    id: 'document',
    name: 'LinkedIn Document',
    icon: FileText,
    description: 'Share PDFs, presentations, and documents',
    platforms: ['linkedin'],
    gradient: 'from-blue-500 to-indigo-500'
  }
];

interface PostTypeSelectorProps {
  selectedPlatforms: string[];
  selectedType: PostType;
  onTypeSelect: (type: PostType) => void;
  onBack: () => void;
  connectedAccounts: SocialAccount[];
}

export default function PostTypeSelector({
  selectedPlatforms,
  selectedType,
  onTypeSelect,
  onBack,
  connectedAccounts
}: PostTypeSelectorProps) {
  console.log('[DEBUG] PostTypeSelector Props:', { 
    selectedPlatforms, 
    selectedType, 
    accountsLength: connectedAccounts.length 
  });

  // Get platform names from connected accounts
  const selectedPlatformNames = selectedPlatforms.map(id => {
    const account = connectedAccounts.find(acc => acc.id === id);
    return account?.platform.toLowerCase() || '';
  }).filter(Boolean);

  console.log('[DEBUG] Selected Platform Names:', selectedPlatformNames);
  
  // Get common post types (available for all selected platforms)
  const commonPostTypes = POST_TYPES.filter(type =>
    type.platforms.length > 1 && // Must support multiple platforms
    selectedPlatformNames.every(platform => 
      type.platforms.includes(platform)
    )
  );

  console.log('[DEBUG] Common Post Types:', commonPostTypes);

  // Get platform-specific post types
  const platformSpecificTypes = selectedPlatformNames.reduce((acc, platform) => {
    const types = POST_TYPES.filter(type => 
      type.platforms.length === 1 && 
      type.platforms[0] === platform
    );
    if (types.length > 0) {
      acc[platform] = types;
    }
    return acc;
  }, {} as Record<string, PostTypeOption[]>);

  console.log('[DEBUG] Platform Specific Types:', platformSpecificTypes);

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

      {/* Common Post Types Section */}
      {commonPostTypes.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">
            Common Post Types
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commonPostTypes.map(renderPostTypeCard)}
          </div>
        </div>
      )}

      {/* Platform-Specific Sections */}
      {Object.entries(platformSpecificTypes).map(([platform, types]) => (
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

      {commonPostTypes.length === 0 && Object.keys(platformSpecificTypes).length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-gray-100">
            <Layout className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Available Post Types
          </h3>
          <p className="text-gray-500 mb-6">
            The selected platforms don't have any compatible post types in common.
            Please select different platforms or go back to modify your selection.
          </p>
          <button
            onClick={onBack}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Select Different Platforms
          </button>
        </div>
      )}
    </div>
  );
}