import React, { useState } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import type { Post, MediaFile } from '../../../types/posts';
import { uploadMedia } from '../../../api/posts';
import PlatformSelector from './PlatformSelector';
import PostTypeSelector from './PostTypeSelector';
import PostContent from './PostContent';
import ValidationErrors from './ValidationErrors';
import SuccessStatus from './SuccessStatus';
import { validatePlatformContent } from '../../../utils/platformValidation';
import { useFileCleanup } from '../../../hooks/useFileCleanup';
import { deleteFile, deleteFiles } from '../../../service/fileCleanupService';
import { APP_URL } from '../../../config/api';
import PlatformSpecificOptions from './PlatformSpecificOptions';
import SchedulingOptions from './SchedulingOptions';
interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (post: Post) => void;
  initialData?: Post;
  connectedAccounts: Array<{ platform: string; id: string }>;
}
export type PostType = 
  | 'post' 
  | 'story' 
  | 'reel' 
  | 'thread' 
  | 'carousel' 
  | 'article' 
  | 'poll' 
  | 'event' 
  | 'fb_story' 
  | 'fb_reel' 
  | 'document';

export default function NewPostModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  connectedAccounts = [],
}: NewPostModalProps) {
  const [step, setStep] = useState<'platform' | 'type' | 'content'>('platform');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{ platform: string; message: string }>>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [publishNow, setPublishNow] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedPostType, setSelectedPostType] = useState<PostType>('post');
  const [postSuccess, setPostSuccess] = useState<{ [key: string]: boolean }>({});
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  // Initialize with a date 1 hour from now for better default scheduling
  const defaultDate = new Date();
  defaultDate.setHours(defaultDate.getHours() + 1);
  
  const [postData, setPostData] = useState({
    caption: '',
    scheduledDate: defaultDate.toISOString().split('T')[0],
    scheduledTime: defaultDate.toTimeString().slice(0, 5),
    hashtags: '',
    visibility: 'public',
    platformSpecificData: {} as Record<string, any>,
  });
  const [uploadedFiles, setUploadedFiles] = useState<MediaFile[]>([]);

  // Initialize file cleanup hook
  const { cleanupFiles } = useFileCleanup({
    files: uploadedFiles,
    onCleanup: deleteFiles
  });

  // Handle modal close
  const handleClose = async () => {
    if (isClosing) return;
    setIsClosing(true);
  
    try {
      if (uploadedFiles.length > 0) {
        await cleanupFiles(uploadedFiles.map(file => file.id));
        setUploadedFiles([]);
      }
    } catch (error) {
      console.error('Failed to cleanup files on modal close:', error);
      toast.error('Failed to cleanup some uploaded files');
    } finally {
      setIsClosing(false);
      setStep('platform');
      setSelectedPlatforms([]);
      setSelectedPostType('post');
      setPostData({
        caption: '',
        scheduledDate: defaultDate.toISOString().split('T')[0],
        scheduledTime: defaultDate.toTimeString().slice(0, 5),
        hashtags: '',
        visibility: 'public',
        platformSpecificData: {},
      });
      onClose();
    }
  };

  // Handle individual file removal
  const handleFileRemove = async (file: MediaFile) => {
    if (!file.id) {
      console.error('No file ID provided for deletion');
      return;
    }

    try {
      await deleteFile(file.id);
      setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
      toast.success('File removed successfully');
    } catch (error) {
      console.error('Failed to remove file:', error);
      toast.error('Failed to remove file. Please try again.');
    }
  };

  // Handle successful post cleanup
  const handleSuccessfulPost = async () => {
    try {
      if (uploadedFiles.length > 0) {
        await cleanupFiles(uploadedFiles.map(file => file.id));
        setUploadedFiles([]);
      }
    } catch (error) {
      console.error('Failed to cleanup files after successful post:', error);
      toast.error('Some uploaded files could not be cleaned up');
    }
  };

  const validateForm = () => {
    if (!postData.caption.trim() && selectedPostType !== 'story') {
      toast.error('Caption is required for this post type');
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

    // Map platform IDs back to platform names for validation
    const platformsToValidate = selectedPlatforms.map(id => {
      const account = connectedAccounts.find(acc => acc.id === id);
      return account?.platform.toLowerCase() || '';
    });

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
    console.log('Starting post submission...');
    setValidationErrors([]);
    setPostSuccess({});

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let scheduledDateTime: Date;
      
      if (publishNow) {
        scheduledDateTime = new Date();
        scheduledDateTime.setMinutes(scheduledDateTime.getMinutes() + 1);
      } else {
        const [year, month, day] = postData.scheduledDate.split('-').map(Number);
        const [hours, minutes] = postData.scheduledTime.split(':').map(Number);
        scheduledDateTime = new Date(year, month - 1, day, hours, minutes);
      }

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const requestBody = {
        caption: postData.caption,
        scheduledDate: scheduledDateTime.toISOString(),
        platforms: selectedPlatforms.map(id => ({
          id,
          platform: connectedAccounts.find(acc => acc.id === id)?.platform || '',
          postType: selectedPostType
        })),
        hashtags: postData.hashtags,
        visibility: postData.visibility,
        mediaFiles: uploadedFiles.map(file => file.id),
        platformSpecificData: postData.platformSpecificData,
        publishNow
      };

      const response = await fetch(`${APP_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create post');
      }

      const responseData = await response.json();
      console.log('Post creation response:', responseData);

      const newPostSuccess = selectedPlatforms.reduce((acc, platform) => {
        acc[platform] = true;
        return acc;
      }, {} as { [key: string]: boolean });
      
      setPostSuccess(newPostSuccess);

      // If all platforms were successful, clean up the files
      const allSuccessful = Object.values(newPostSuccess).every(success => success);
      if (allSuccessful) {
        await handleSuccessfulPost();
        toast.success('Post created successfully');
      }
      
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      console.error('Post creation error:', err);
      if (err.platformErrors) {
        const failedPlatforms = Object.keys(err.platformErrors);
        const successfulPlatforms = selectedPlatforms.filter(
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

        toast.error('Failed to publish to some platforms');
      } else {
        setError(err.message || 'Failed to create post');
        toast.error('Failed to create post');
      }
    } finally {
      setLoading(false);
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {initialData ? 'Edit Post' : 'Create New Post'}
            </h2>
            {step !== 'platform' && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-sm text-gray-500">
                  Step {step === 'type' ? '2' : '3'} of 3
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading || uploadingFiles || isClosing}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <ValidationErrors errors={validationErrors} />
            <SuccessStatus postSuccess={postSuccess} />

            {step === 'platform' && (
              <PlatformSelector
                platforms={connectedAccounts}
                selectedPlatforms={selectedPlatforms}
                onPlatformSelect={(platformId) => {
                  setSelectedPlatforms(prev => {
                    const index = prev.indexOf(platformId);
                    if (index === -1) {
                      return [...prev, platformId];
                    }
                    return prev.filter(id => id !== platformId);
                  });
                }}
                onNext={() => setStep('type')}
              />
            )}

            {step === 'type' && (
              <PostTypeSelector
                selectedPlatforms={selectedPlatforms}
                selectedType={selectedPostType}
                onTypeSelect={setSelectedPostType}
                onBack={() => setStep('platform')}
                onNext={() => setStep('content')}
                connectedAccounts={connectedAccounts}
              />
            )}

            {step === 'content' && (
              <div className="space-y-6">
                <PostContent
                  postType={selectedPostType}
                  caption={postData.caption}
                  onCaptionChange={(e) => setPostData({ ...postData, caption: e.target.value })}
                  hashtags={postData.hashtags}
                  onHashtagsChange={(e) => setPostData({ ...postData, hashtags: e.target.value })}
                  visibility={postData.visibility}
                  onVisibilityChange={(e) => setPostData({ ...postData, visibility: e.target.value })}
                  uploadedFiles={uploadedFiles}
                  onMediaUpload={async (files) => {
                    try {
                      setUploadingFiles(true);
                      const uploadedMediaFiles = await Promise.all(
                        files.map(file => uploadMedia(file))
                      );
                      setUploadedFiles(prev => [...prev, ...uploadedMediaFiles]);
                    } catch (error) {
                      console.error('Upload error:', error);
                      setUploadError(error instanceof Error ? error.message : 'Failed to upload media');
                    } finally {
                      setUploadingFiles(false);
                    }
                  }}
                  onMediaRemove={handleFileRemove}
                  uploadError={uploadError}
                />

                {selectedPlatforms.map(platformId => {
                  const account = connectedAccounts.find(acc => acc.id === platformId);
                  if (!account) return null;
                  
                  return (
                    <PlatformSpecificOptions
                      key={platformId}
                      platform={account.platform.toLowerCase()}
                      postType={selectedPostType}
                      data={postData.platformSpecificData[platformId]}
                      onChange={(data) => setPostData(prev => ({
                        ...prev,
                        platformSpecificData: {
                          ...prev.platformSpecificData,
                          [platformId]: data
                        }
                      }))}
                    />
                  );
                })}

                <SchedulingOptions
                  publishNow={publishNow}
                  setPublishNow={setPublishNow}
                  scheduledDate={postData.scheduledDate}
                  scheduledTime={postData.scheduledTime}
                  onDateChange={(e) => setPostData({ ...postData, scheduledDate: e.target.value })}
                  onTimeChange={(e) => setPostData({ ...postData, scheduledTime: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>
        {/* Footer */}
        {step === 'content' && (
          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                disabled={loading || uploadingFiles || isClosing}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors disabled:opacity-50"
                disabled={loading || uploadingFiles || isClosing}
              >
                {(loading || uploadingFiles) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {initialData
                  ? 'Save Changes'
                  : publishNow
                  ? 'Publish Now'
                  : 'Schedule Post'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}