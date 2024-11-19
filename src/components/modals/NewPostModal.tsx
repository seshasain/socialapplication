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

// Platform-specific limits and validations
const PLATFORM_LIMITS = {
  twitter: {
    maxCharacters: 280,
    maxVideoLength: 140,
    maxVideoSize: 512,
    maxImages: 4,
    maxVideos: 1,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
  },
  instagram: {
    maxCharacters: 2200,
    maxVideoLength: 60,
    maxVideoSize: 100,
    maxImages: 10,
    maxVideos: 1,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
  },
  facebook: {
    maxCharacters: 63206,
    maxVideoLength: 240,
    maxVideoSize: 4096,
    maxImages: 10,
    maxVideos: 1,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
  },
  linkedin: {
    maxCharacters: 3000,
    maxVideoLength: 600,
    maxVideoSize: 5120,
    maxImages: 9,
    maxVideos: 1,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
  },
  youtube: {
    maxCharacters: 5000,
    maxVideoLength: 43200,
    maxVideoSize: 128000,
    maxImages: 1,
    maxVideos: 1,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
  },
};

export default function NewPostModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  connectedAccounts = [],
}: NewPostModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{ platform: string; message: string }>>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [publishNow, setPublishNow] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [postSuccess, setPostSuccess] = useState<{ [key: string]: boolean }>({});
  
  // Initialize with a date 1 hour from now for better default scheduling
  const defaultDate = new Date();
  defaultDate.setHours(defaultDate.getHours() + 1);
  
  const [postData, setPostData] = useState<PostFormData>({
    caption: '',
    scheduledDate: defaultDate.toISOString().split('T')[0],
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

  const validatePlatformContent = (platform: string, fullText: string, mediaFiles: MediaFile[]) => {
    const errors: Array<{ platform: string; message: string }> = [];
    const limits = PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS];
    
    if (!limits) return errors;

    // Text length validation
    if (fullText.length > limits.maxCharacters) {
      errors.push({
        platform,
        message: `Text exceeds ${limits.maxCharacters} characters limit for ${platform}`,
      });
    }

    // Media validations
    const images = mediaFiles.filter(file => file.type.startsWith('image/'));
    const videos = mediaFiles.filter(file => file.type.startsWith('video/'));

    if (images.length > limits.maxImages) {
      errors.push({
        platform,
        message: `Maximum ${limits.maxImages} images allowed for ${platform}`,
      });
    }

    if (videos.length > limits.maxVideos) {
      errors.push({
        platform,
        message: `Maximum ${limits.maxVideos} videos allowed for ${platform}`,
      });
    }

    // Media type support
    mediaFiles.forEach(file => {
      if (!limits.supportedMediaTypes.includes(file.type)) {
        errors.push({
          platform,
          message: `${file.type} is not supported on ${platform}`,
        });
      }
    });

    // Video constraints
    videos.forEach(video => {
      if (video.size > limits.maxVideoSize * 1024 * 1024) {
        errors.push({
          platform,
          message: `Video exceeds ${limits.maxVideoSize}MB limit for ${platform}`,
        });
      }

      if (video.duration && video.duration > limits.maxVideoLength) {
        errors.push({
          platform,
          message: `Video exceeds ${limits.maxVideoLength} seconds limit for ${platform}`,
        });
      }
    });

    return errors;
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

    const platformsToValidate = getSelectedPlatformNames();
    const fullText = `${postData.caption} ${postData.hashtags}`;
    
    const allErrors = platformsToValidate.flatMap(platform => 
      validatePlatformContent(platform, fullText, uploadedFiles)
    );

    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      return false;
    }

    setValidationErrors([]);
    return true;
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    setPostSuccess({});

    const isValid = validateForm();
    if (!isValid) return;

    try {
      setLoading(true);
      setError(null);

      const platformsToPost = getSelectedPlatformNames();
      let scheduledDateTime: Date;
      
      if (publishNow) {
        scheduledDateTime = new Date();
        scheduledDateTime.setMinutes(scheduledDateTime.getMinutes() + 1);
      } else {
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
      
      // Update success status for each platform
      const newPostSuccess = platformsToPost.reduce((acc, platform) => {
        acc[platform] = true;
        return acc;
      }, {} as { [key: string]: boolean });
      
      setPostSuccess(newPostSuccess);
      
      // Show success message for 2 seconds before closing
      setTimeout(() => {
        onSave(post);
        onClose();
      }, 20000);
    } catch (err: any) {
      console.error('Post creation error:', err);
      if (err.platformErrors) {
        // Handle platform-specific errors
        const failedPlatforms = Object.keys(err.platformErrors);
        const successfulPlatforms = getSelectedPlatformNames().filter(
          platform => !failedPlatforms.includes(platform)
        );
        
        // Update success/failure status
        const newPostSuccess = [...successfulPlatforms].reduce((acc, platform) => {
          acc[platform] = true;
          return acc;
        }, {} as { [key: string]: boolean });
        
        setPostSuccess(newPostSuccess);
        setValidationErrors(
          failedPlatforms.map(platform => ({
            platform,
            message: err.platformErrors[platform]
          }))
        );
      } else {
        setError(err.message || 'Failed to create post');
      }
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

          {validationErrors.length > 0 && (
            <div className="mb-6 p-3 bg-yellow-100 border border-yellow-200 text-yellow-800 rounded-lg">
              <h3 className="font-semibold mb-2">Platform Validation Issues:</h3>
              <ul className="list-disc pl-5">
                {validationErrors.map((error, index) => (
                  <li key={index}>
                    {error.platform}: {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Object.keys(postSuccess).length > 0 && (
            <div className="mb-6 p-3 bg-green-100 border border-green-200 text-green-800 rounded-lg">
              <h3 className="font-semibold mb-2">Post Status:</h3>
              <ul className="space-y-1">
                {Object.entries(postSuccess).map(([platform, success]) => (
                  <li key={platform} className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    {platform}: Successfully posted
                  </li>
                ))}
              </ul>
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