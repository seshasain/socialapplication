import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Hash,
  Globe,
  Loader2,
  Clock,
  Zap,
  AlertCircle,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Check,
} from 'lucide-react';
import { Post, PostFormData, MediaFile } from '../../types/posts';
import MediaUploader from '../media/MediaUploader';
import { createPost, uploadMedia } from '../../api/posts';

interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (post: Post) => void;
  initialData?: Post;
  connectedAccounts: Array<{ platform: string; id: string }>;
}

export default function NewPostModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  connectedAccounts = [],
}: NewPostModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [publishNow, setPublishNow] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  
  // Initialize with a date 1 hour from now for better default scheduling
  const defaultDate = new Date();
  defaultDate.setHours(defaultDate.getHours() + 1);
  
  const [postData, setPostData] = useState<PostFormData>({
    caption: '',
    scheduledDate: defaultDate.toISOString().split('T')[0],
    scheduledTime: defaultDate.toTimeString().slice(0, 5),
    platform: '',
    hashtags: '',
    visibility: 'public',
    mediaFiles: [],
  });
  const [uploadedFiles, setUploadedFiles] = useState<MediaFile[]>([]);

  const allPlatforms = [
    { id: 'all', name: 'All Platforms', icon: Globe },
    { id: 'instagram', name: 'Instagram', icon: Instagram },
    { id: 'facebook', name: 'Facebook', icon: Facebook },
    { id: 'twitter', name: 'Twitter', icon: Twitter },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
    { id: 'youtube', name: 'YouTube', icon: Youtube },
  ];

  const platforms = [
    allPlatforms[0],
    ...allPlatforms
      .slice(1)
      .filter((platform) =>
        connectedAccounts.some(
          (account) => account.platform.toLowerCase() === platform.id
        )
      ),
  ];

  useEffect(() => {
    if (initialData) {
      const scheduledDate = new Date(initialData.scheduledDate);
      setPostData({
        caption: initialData.caption || '',
        scheduledDate: scheduledDate.toISOString().split('T')[0],
        scheduledTime: scheduledDate.toTimeString().slice(0, 5),
        platform: initialData.platform || '',
        hashtags: initialData.hashtags || '',
        visibility: initialData.visibility || 'public',
        mediaFiles: [],
      });

      const initialSelectedPlatforms = initialData.platforms.map(
        (p) => p.platform.toLowerCase()
      );

      if (initialSelectedPlatforms.length === connectedAccounts.length) {
        setSelectedPlatforms(['all']);
      } else {
        setSelectedPlatforms(initialSelectedPlatforms);
      }
    } else {
      // Reset form when opening for new post
      setPostData({
        caption: '',
        scheduledDate: defaultDate.toISOString().split('T')[0],
        scheduledTime: defaultDate.toTimeString().slice(0, 5),
        platform: '',
        hashtags: '',
        visibility: 'public',
        mediaFiles: [],
      });
      setSelectedPlatforms([]);
      setUploadedFiles([]);
      setPublishNow(false);
    }
  }, [initialData, connectedAccounts, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setUploadError(null);
    }
  }, [isOpen]);

  const handlePlatformSelect = (platformId: string) => {
    if (platformId === 'all') {
      if (selectedPlatforms.includes('all')) {
        setSelectedPlatforms([]);
      } else {
        setSelectedPlatforms(['all']);
      }
    } else {
      setSelectedPlatforms((prev) => {
        const newPlatforms = prev.filter((p) => p !== 'all');
        if (newPlatforms.includes(platformId)) {
          return newPlatforms.filter((p) => p !== platformId);
        } else {
          return [...newPlatforms, platformId];
        }
      });
    }
  };

  const isPlatformSelected = (platformId: string) => {
    return (
      selectedPlatforms.includes(platformId) ||
      (selectedPlatforms.includes('all') && platformId !== 'all')
    );
  };

  const getSelectedPlatformNames = (): string[] => {
    if (selectedPlatforms.includes('all')) {
      return connectedAccounts.map(account => account.platform.toLowerCase());
    }
    return selectedPlatforms.map(platform => platform.toLowerCase());
  };

  const handleMediaUpload = async (files: File[]) => {
    try {
      setLoading(true);
      setUploadError(null);

      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return uploadMedia(formData);
      });

      const uploadedMediaFiles = await Promise.all(uploadPromises);
      setUploadedFiles((prev) => [...prev, ...uploadedMediaFiles]);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(
        err instanceof Error ? err.message : 'Failed to upload media'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMedia = (file: File | MediaFile) => {
    if ('url' in file) {
      setUploadedFiles((prev) => prev.filter((f) => f.id !== file.id));
    }
  };

  const validateForm = () => {
    if (!postData.caption.trim()) {
      setError('Caption is required');
      return false;
    }
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform');
      return false;
    }
    if (!publishNow && postData.scheduledDate && postData.scheduledTime) {
      const scheduledDateTime = new Date(
        `${postData.scheduledDate}T${postData.scheduledTime}`
      );
      if (scheduledDateTime <= new Date()) {
        setError('Scheduled date must be in the future');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const platformsToPost = getSelectedPlatformNames();

      // Create a proper date object by combining date and time
      let scheduledDateTime: Date;
      
      if (publishNow) {
        // Set scheduled date to 1 minute from now for immediate publishing
        scheduledDateTime = new Date();
        scheduledDateTime.setMinutes(scheduledDateTime.getMinutes() + 1);
      } else {
        // Parse the date and time inputs
        const [year, month, day] = postData.scheduledDate!.split('-').map(Number);
        const [hours, minutes] = postData.scheduledTime!.split(':').map(Number);
        scheduledDateTime = new Date(year, month - 1, day, hours, minutes);
      }

      const requestBody = {
        caption: postData.caption,
        scheduledDate: scheduledDateTime.toISOString(),
        selectedPlatforms: platformsToPost,
        hashtags: postData.hashtags,
        visibility: postData.visibility,
        mediaFiles: uploadedFiles.length > 0
          ? uploadedFiles.map(file => file.id)
          : null,
        publishNow
      };

      const post = await createPost(requestBody);
      onSave(post);
      onClose();
    } catch (err) {
      console.error('Post creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {initialData ? 'Edit Post' : 'Create New Post'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Platforms
              </label>
              <div className="grid grid-cols-3 gap-2">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => handlePlatformSelect(platform.id)}
                    className={`flex items-center justify-center p-3 rounded-lg border ${
                      isPlatformSelected(platform.id)
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <platform.icon className="w-5 h-5 mr-2" />
                    <span className="text-sm font-medium">{platform.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedPlatforms.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {platforms
                  .filter((p) => isPlatformSelected(p.id) && p.id !== 'all')
                  .map((platform) => (
                    <div
                      key={platform.id}
                      className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full"
                    >
                      <platform.icon className="w-4 h-4 mr-1" />
                      <span className="text-sm">{platform.name}</span>
                    </div>
                  ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Caption
              </label>
              <textarea
                value={postData.caption}
                onChange={(e) =>
                  setPostData({ ...postData, caption: e.target.value })
                }
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
                onUpload={handleMediaUpload}
                onRemove={handleRemoveMedia}
                existingFiles={uploadedFiles}
                maxFiles={10}
                acceptedFileTypes={['image/*', 'video/*']}
                error={uploadError}
              />
            </div>

            <div className="flex items-center space-x-4 mb-4">
              <button
                type="button"
                onClick={() => setPublishNow(false)}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  !publishNow
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } transition-colors`}
              >
                <Clock className="w-4 h-4 mr-2" />
                Schedule Post
              </button>
              <button
                type="button"
                onClick={() => setPublishNow(true)}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  publishNow
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } transition-colors`}
              >
                <Zap className="w-4 h-4 mr-2" />
                Publish Now
              </button>
            </div>

            {!publishNow && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={postData.scheduledDate}
                    onChange={(e) =>
                      setPostData({
                        ...postData,
                        scheduledDate: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={postData.scheduledTime}
                    onChange={(e) =>
                      setPostData({
                        ...postData,
                        scheduledTime: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Hash className="inline w-4 h-4 mr-1" />
                Hashtags
              </label>
              <input
                type="text"
                value={postData.hashtags}
                onChange={(e) =>
                  setPostData({ ...postData, hashtags: e.target.value })
                }
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
                value={postData.visibility}
                onChange={(e) =>
                  setPostData({ ...postData, visibility: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {initialData
                  ? 'Save Changes'
                  : publishNow
                  ? 'Publish Now'
                  : 'Schedule Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}