import React from 'react';
import { Hash, Globe, Image as ImageIcon, Film, Clock, AlertCircle, ChevronLeft } from 'lucide-react';
import MediaUploader from '../../media/MediaUploader';
import ThreadComposer from './ThreadComposer';
import { getPlatformLimits } from '../../../utils/platformSupport';
import type { MediaFile } from '../../../types/media';
import type { PostType } from './index';
import { PLATFORM_SUPPORT } from '../../../utils/platformSupport';

interface PostContentProps {
  postType: PostType;
  caption: string;
  onCaptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  hashtags: string;
  onHashtagsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  visibility: string;
  onVisibilityChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  uploadedFiles: MediaFile[];
  onMediaUpload: (files: File[]) => Promise<void>;
  onMediaRemove: (file: MediaFile) => void;
  uploadError: string | null;
  onBack: () => void;
  selectedPlatforms: string[];
  connectedAccounts: Array<{ id: string; platform: string }>;
  threadContent?: string[];
  onThreadChange?: (threads: string[]) => void;
  threadMedia?: Record<string, MediaFile[]>;
}

export default function PostContent({
  postType,
  caption,
  onCaptionChange,
  hashtags,
  onHashtagsChange,
  visibility,
  onVisibilityChange,
  uploadedFiles,
  onMediaUpload,
  onMediaRemove,
  uploadError,
  onBack,
  selectedPlatforms = [],
  connectedAccounts = [],
  threadContent = [],
  onThreadChange,
  threadMedia = {}
}: PostContentProps) {
  console.log('Selected Platform IDs:', selectedPlatforms);
  console.log('Connected Accounts:', connectedAccounts);

  const getPostTypeConfig = () => {
    switch (postType) {
      case 'story':
        return {
          title: 'Create Story',
          description: 'Share a temporary update that disappears in 24 hours',
          icon: Clock,
          mediaRequired: true,
          captionOptional: true,
          maxFiles: 1,
        };
      case 'reel':
        return {
          title: 'Create Reel',
          description: 'Share an engaging short-form video',
          icon: Film,
          mediaRequired: true,
          captionOptional: false,
          maxFiles: 1,
          acceptedTypes: ['video/*'],
        };
      case 'carousel':
        return {
          title: 'Create Carousel Post',
          description: 'Share multiple photos or videos in a single post',
          icon: ImageIcon,
          mediaRequired: true,
          captionOptional: false,
          maxFiles: 10,
        };
      case 'thread':
        return {
          title: 'Create Thread',
          description: 'Share a series of connected tweets with media',
          icon: ImageIcon,
          mediaRequired: false,
          captionOptional: false,
          maxFiles: 4,
        };
      default:
        return {
          title: 'Create Post',
          description: 'Share an update with your audience',
          icon: ImageIcon,
          mediaRequired: false,
          captionOptional: false,
          maxFiles: 4,
        };
    }
  };

  const config = getPostTypeConfig();
  const Icon = config.icon;

  const getMediaLimit = () => {
    if (!selectedPlatforms?.length) {
      return 10; // Higher default limit
    }

    // Get all platform limits
    const platformLimits = selectedPlatforms.map(platformId => {
      const account = connectedAccounts.find(acc => acc.id === platformId);
      const platformName = account?.platform?.toLowerCase();
      const limits = platformName ? getPlatformLimits(platformName) : null;
      return limits?.maxMedia || 10;
    });

    // If only one platform is selected, use its limit
    if (platformLimits.length === 1) {
      return platformLimits[0];
    }

    // For multiple platforms, find the minimum limit
    return Math.min(...platformLimits);
  };

  const mediaLimit = getMediaLimit();

  return (
    <div className="space-y-6">
      {/* Back Button and Post Type Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Post Type
        </button>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 flex items-start space-x-4">
        <div className="p-3 bg-white rounded-xl shadow-sm">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{config.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{config.description}</p>
        </div>
      </div>

      {/* Thread Composer for Twitter Threads */}
      {postType === 'thread' ? (
        <ThreadComposer
          value={threadContent}
          onChange={onThreadChange || (() => {})}
          maxThreads={25}
          onMediaUpload={onMediaUpload}
          onMediaRemove={onMediaRemove}
          uploadedFiles={threadMedia}
          uploadError={uploadError}
        />
      ) : (
        <>
          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caption {!config.captionOptional && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={caption}
              onChange={onCaptionChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 h-32 resize-none"
              placeholder={`Write your ${postType} caption here...`}
              required={!config.captionOptional}
            />
          </div>

          {/* Media Upload */}
          <div className="mt-12 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">Media</span>
              </div>
              <span className="text-sm text-gray-500 font-medium">
                {uploadedFiles.length} of {mediaLimit} files
              </span>
            </div>
            
            <MediaUploader
              onUpload={onMediaUpload}
              onRemove={onMediaRemove}
              existingFiles={uploadedFiles}
              maxFiles={mediaLimit}
              acceptedFileTypes={['image/*', 'video/*']}
              error={uploadError}
            />

            {/* Show platform-specific limits */}
            <div className="mt-2 space-y-2">
              {selectedPlatforms.map(platformId => {
                const account = connectedAccounts.find(acc => acc.id === platformId);
                const platformName = account?.platform?.toLowerCase();
                const limits = platformName ? getPlatformLimits(platformName) : null;
                
                return limits && (
                  <div key={platformId} className="text-sm text-gray-600">
                    <span className="font-medium capitalize">{platformName}:</span> {limits.maxMedia} files max
                    {uploadedFiles.length > limits.maxMedia && (
                      <span className="text-amber-600 ml-2">
                        Exceeds {platformName}'s limit
                      </span>
                    )}
                  </div>
                );
              })}
              
              {selectedPlatforms.length > 1 && (
                <div className="text-sm text-gray-500 mt-2 pt-2 border-t">
                  <span className="font-medium">Combined limit:</span> {mediaLimit} files
                  <br />
                  <span className="text-xs">(Based on most restrictive platform)</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Hashtags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Hash className="inline w-4 h-4 mr-1" />
          Hashtags
        </label>
        <input
          type="text"
          value={hashtags}
          onChange={onHashtagsChange}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
          placeholder="#socialmedia #marketing"
        />
        <p className="mt-1 text-sm text-gray-500">
          Separate hashtags with spaces
        </p>
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Globe className="inline w-4 h-4 mr-1" />
          Visibility
        </label>
        <select
          value={visibility}
          onChange={onVisibilityChange}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
        >
          <option value="public">Public - Anyone can see this post</option>
          <option value="followers">Followers - Only your followers can see this post</option>
          <option value="private">Private - Only you can see this post</option>
        </select>
      </div>
    </div>
  );
}