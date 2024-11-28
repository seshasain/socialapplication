import React from 'react';
import { Hash, Globe } from 'lucide-react';
import MediaUploader from '../../media/MediaUploader';
import type { MediaFile } from '../../../types/media';

interface PostContentProps {
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
}

export default function PostContent({
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
}: PostContentProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Caption
        </label>
        <textarea
          value={caption}
          onChange={onCaptionChange}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 h-32"
          placeholder="Write your caption here..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Media
        </label>
        <MediaUploader
          onUpload={onMediaUpload}
          onRemove={onMediaRemove}
          existingFiles={uploadedFiles}
          maxFiles={10}
          acceptedFileTypes={['image/*', 'video/*']}
          error={uploadError}
        />
      </div>

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
      </div>

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
          <option value="public">Public</option>
          <option value="private">Private</option>
          <option value="draft">Draft</option>
        </select>
      </div>
    </>
  );
}