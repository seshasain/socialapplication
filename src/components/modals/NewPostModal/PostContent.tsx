import React from 'react';
import { Hash, Globe, Image as ImageIcon, Film, Clock, AlertCircle, ChevronLeft } from 'lucide-react';
import MediaUploader from '../../media/MediaUploader';
import type { MediaFile } from '../../../types/media';
import type { PostType } from './index';

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
  onBack
}: PostContentProps) {
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
      case 'article':
        return {
          title: 'Create Article',
          description: 'Share long-form content with your network',
          icon: ImageIcon,
          mediaRequired: false,
          captionOptional: false,
          maxFiles: 1,
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

  return (
    <div className="space-y-6">
      {/* Back Button and Post Type Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </button>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 flex items-start space-x-4">
        <div className="p-3 bg-white rounded-xl shadow-sm">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{config.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{config.description}</p>
        </div>
      </div>

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
        <div className="mt-1 text-sm text-gray-500 flex justify-between">
          <span>{caption.length} characters</span>
          <span>{2200 - caption.length} remaining</span>
        </div>
      </div>

      {/* Media Upload */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Media {config.mediaRequired && <span className="text-red-500">*</span>}
          </label>
          <span className="text-sm text-gray-500">
            {uploadedFiles.length} of {config.maxFiles} files used
          </span>
        </div>
        <MediaUploader
          onUpload={onMediaUpload}
          onRemove={onMediaRemove}
          existingFiles={uploadedFiles}
          maxFiles={config.maxFiles}
          acceptedFileTypes={config.acceptedTypes || ['image/*', 'video/*']}
          error={uploadError}
        />
        {config.mediaRequired && uploadedFiles.length === 0 && (
          <div className="mt-2 flex items-center text-sm text-amber-600">
            <AlertCircle className="w-4 h-4 mr-1" />
            Media is required for this post type
          </div>
        )}
      </div>

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