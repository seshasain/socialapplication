import React from 'react';
import { 
  Image, 
  Film, 
  MessageCircle, 
  Layout, 
  FileText, 
  Clock,
  ChevronLeft,
  Lock,
  Sparkles,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Music2,
  PlaySquare,
  Camera,
  BookOpen,
  Layers,
  PenTool
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
  category: 'regular' | 'story' | 'short' | 'article';
}

const POST_TYPES: PostTypeOption[] = [
  // Regular Posts
  {
    id: 'post',
    name: 'Regular Post',
    icon: Image,
    description: 'Share photos, videos, or text updates with your audience',
    platforms: ['instagram', 'facebook', 'twitter', 'linkedin'],
    gradient: 'from-blue-500 to-blue-600',
    category: 'regular'
  },
  {
    id: 'carousel',
    name: 'Carousel Post',
    icon: Layers,
    description: 'Share multiple photos or videos in a single post',
    platforms: ['instagram', 'facebook', 'linkedin'],
    gradient: 'from-indigo-500 to-blue-600',
    category: 'regular'
  },
  
  // Stories
  {
    id: 'story',
    name: 'Story',
    icon: Clock,
    description: '24-hour temporary content with interactive elements',
    platforms: ['instagram', 'facebook'],
    gradient: 'from-purple-500 to-pink-500',
    category: 'story'
  },
  
  // Short-form Videos
  {
    id: 'reel',
    name: 'Short Video',
    icon: PlaySquare,
    description: 'Create engaging short-form videos (Reels, Shorts, TikTok)',
    platforms: ['instagram', 'facebook', 'youtube'],
    gradient: 'from-pink-500 to-rose-500',
    category: 'short'
  },
  
  // Articles & Long-form
  {
    id: 'article',
    name: 'Article',
    icon: BookOpen,
    description: 'Share long-form content with rich formatting',
    platforms: ['linkedin'],
    premium: true,
    gradient: 'from-blue-600 to-indigo-600',
    category: 'article'
  },
  {
    id: 'thread',
    name: 'Thread',
    icon: MessageCircle,
    description: 'Create connected series of posts for longer narratives',
    platforms: ['twitter'],
    gradient: 'from-blue-400 to-blue-500',
    category: 'article'
  }
];

const CATEGORIES = {
  regular: {
    name: 'Regular Posts',
    description: 'Standard posts for your social media platforms',
    icon: Image
  },
  story: {
    name: 'Stories',
    description: '24-hour temporary content',
    icon: Clock
  },
  short: {
    name: 'Short Videos',
    description: 'Engaging short-form video content',
    icon: PlaySquare
  },
  article: {
    name: 'Long-form Content',
    description: 'Articles, threads, and detailed content',
    icon: BookOpen
  }
};

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
  // Get platform names from connected accounts
  const selectedPlatformNames = selectedPlatforms.map(id => {
    const account = connectedAccounts.find(acc => acc.id === id);
    return account?.platform.toLowerCase() || '';
  }).filter(Boolean);

  // Group post types by category
  const groupedPostTypes = POST_TYPES.reduce((acc, type) => {
    // Check if this post type is available for the selected platforms
    const isAvailable = selectedPlatformNames.some(platform => 
      type.platforms.includes(platform)
    );

    if (isAvailable) {
      if (!acc[type.category]) {
        acc[type.category] = [];
      }
      acc[type.category].push(type);
    }
    return acc;
  }, {} as Record<string, PostTypeOption[]>);

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
      case 'youtube':
        return <Youtube className="w-5 h-5 text-red-600" />;
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
              <div className="flex items-center mt-2 space-x-1">
                {type.platforms.map(platform => (
                  <span key={platform} className="text-gray-400">
                    {getPlatformIcon(platform)}
                  </span>
                ))}
              </div>
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

      {/* Scrollable content area */}
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-4 -mr-4">
        {Object.entries(groupedPostTypes).map(([category, types]) => {
          const categoryInfo = CATEGORIES[category as keyof typeof CATEGORIES];
          
          return (
            <div key={category} className="mb-8 last:mb-0">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 rounded-lg bg-gray-100">
                  <categoryInfo.icon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{categoryInfo.name}</h4>
                  <p className="text-sm text-gray-500">{categoryInfo.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {types.map(renderPostTypeCard)}
              </div>
            </div>
          );
        })}

        {Object.keys(groupedPostTypes).length === 0 && (
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
    </div>
  );
}