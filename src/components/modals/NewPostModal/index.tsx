import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import type { Post, MediaFile } from '../../../types/posts';
import { uploadMedia } from '../../../api/posts';
import PlatformSelector from './PlatformSelector';
import SchedulingOptions from './SchedulingOptions';
import PostContent from './PostContent';
import ValidationErrors from './ValidationErrors';
import SuccessStatus from './SuccessStatus';
import { validatePlatformContent } from '../../../utils/platformValidation';

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
  const [validationErrors, setValidationErrors] = useState<Array<{ platform: string; message: string }>>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [publishNow, setPublishNow] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [postSuccess, setPostSuccess] = useState<{ [key: string]: boolean }>({});
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  // Initialize with a date 1 hour from now for better default scheduling
  const defaultDate = new Date();
  defaultDate.setHours(defaultDate.getHours() + 1);
  
  const [postData, setPostData] = useState({
    caption: '',
    scheduledDate: defaultDate.toISOString().split('T')[0],
    scheduledTime: defaultDate.toTimeString().slice(0, 5),
    hashtags: '',
    visibility: 'public',
  });
  const [uploadedFiles, setUploadedFiles] = useState<MediaFile[]>([]);

  const platforms = [
    { id: 'all', name: 'All Platforms' },
    ...connectedAccounts.map(account => ({
      id: account.platform.toLowerCase(),
      name: account.platform
    }))
  ];

  useEffect(() => {
    if (initialData) {
      const scheduledDate = new Date(initialData.scheduledDate);
      setPostData({
        caption: initialData.caption || '',
        scheduledDate: scheduledDate.toISOString().split('T')[0],
        scheduledTime: scheduledDate.toTimeString().slice(0, 5),
        hashtags: initialData.hashtags || '',
        visibility: initialData.visibility || 'public',
      });

      if (initialData.mediaFiles) {
        setUploadedFiles(initialData.mediaFiles);
      }

      const initialSelectedPlatforms = initialData.platforms.map(
        (p) => p.platform.toLowerCase()
      );

      if (initialSelectedPlatforms.length === connectedAccounts.length) {
        setSelectedPlatforms(['all']);
      } else {
        setSelectedPlatforms(initialSelectedPlatforms);
      }
    } else {
      resetForm();
    }
  }, [initialData, connectedAccounts, isOpen]);

  const resetForm = () => {
    setPostData({
      caption: '',
      scheduledDate: defaultDate.toISOString().split('T')[0],
      scheduledTime: defaultDate.toTimeString().slice(0, 5),
      hashtags: '',
      visibility: 'public',
    });
    setSelectedPlatforms([]);
    setUploadedFiles([]);
    setPublishNow(false);
    setValidationErrors([]);
    setPostSuccess({});
    setError(null);
    setUploadError(null);
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
      setUploadingFiles(true);
      setUploadError(null);

      const uploadPromises = files.map(file => uploadMedia(file));
      const uploadedMediaFiles = await Promise.all(uploadPromises);

      setUploadedFiles(prev => [...prev, ...uploadedMediaFiles]);
      console.log('Files uploaded successfully:', uploadedMediaFiles);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err instanceof Error ? err.message : 'Failed to upload media');
      toast.error('Failed to upload media files');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleMediaRemove = (file: MediaFile) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
  };

  const validateForm = () => {
    if (!postData.caption.trim()) {
      toast.error('Caption is required');
      return false;
    }
    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform');
      return false;
    }
    if (!publishNow && postData.scheduledDate && postData.scheduledTime) {
      const scheduledDateTime = new Date(
        `${postData.scheduledDate}T${postData.scheduledTime}`
      );
      if (scheduledDateTime <= new Date()) {
        toast.error('Scheduled date must be in the future');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    setPostSuccess({});

    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const platformsToPost = getSelectedPlatformNames();
      let scheduledDateTime: Date;
      
      if (publishNow) {
        scheduledDateTime = new Date();
        scheduledDateTime.setMinutes(scheduledDateTime.getMinutes() + 1);
      } else {
        const [year, month, day] = postData.scheduledDate.split('-').map(Number);
        const [hours, minutes] = postData.scheduledTime.split(':').map(Number);
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

      const post = await onSave(requestBody as any);
      
      const newPostSuccess = platformsToPost.reduce((acc, platform) => {
        acc[platform] = true;
        return acc;
      }, {} as { [key: string]: boolean });
      
      setPostSuccess(newPostSuccess);
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Post creation error:', err);
      if (err.platformErrors) {
        const failedPlatforms = Object.keys(err.platformErrors);
        const successfulPlatforms = getSelectedPlatformNames().filter(
          platform => !failedPlatforms.includes(platform)
        );
        
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
              disabled={loading || uploadingFiles}
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

          <ValidationErrors errors={validationErrors} />
          <SuccessStatus postSuccess={postSuccess} />

          <form onSubmit={handleSubmit} className="space-y-6">
            <PlatformSelector
              platforms={platforms}
              selectedPlatforms={selectedPlatforms}
              onPlatformSelect={handlePlatformSelect}
              isPlatformSelected={isPlatformSelected}
            />

            <SchedulingOptions
              publishNow={publishNow}
              setPublishNow={setPublishNow}
              scheduledDate={postData.scheduledDate}
              scheduledTime={postData.scheduledTime}
              onDateChange={(e) => setPostData({ ...postData, scheduledDate: e.target.value })}
              onTimeChange={(e) => setPostData({ ...postData, scheduledTime: e.target.value })}
            />

            <PostContent
              caption={postData.caption}
              onCaptionChange={(e) => setPostData({ ...postData, caption: e.target.value })}
              hashtags={postData.hashtags}
              onHashtagsChange={(e) => setPostData({ ...postData, hashtags: e.target.value })}
              visibility={postData.visibility}
              onVisibilityChange={(e) => setPostData({ ...postData, visibility: e.target.value })}
              uploadedFiles={uploadedFiles}
              onMediaUpload={handleMediaUpload}
              onMediaRemove={handleMediaRemove}
              uploadError={uploadError}
            />

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                disabled={loading || uploadingFiles}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors disabled:opacity-50"
                disabled={loading || uploadingFiles}
              >
                {(loading || uploadingFiles) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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





































