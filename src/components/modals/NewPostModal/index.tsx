import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import type { Post, MediaFile } from '../../../types/posts';
import type { SocialAccount } from '../../../types/overview';
import { uploadMedia } from '../../../api/posts';
import PlatformSelector from './PlatformSelector';
import PostTypeSelector from './PostTypeSelector';
import PostContent from './PostContent';
import ValidationErrors from './ValidationErrors';
import SuccessStatus from './SuccessStatus';
import { validatePlatformContent } from '../../../utils/platformValidation';
import { useFileCleanup } from '../../../hooks/useFileCleanup';
import { deleteFile } from '../../../service/fileCleanupService';
import { APP_URL } from '../../../config/api';
import PlatformSpecificOptions from './PlatformSpecificOptions';
import SchedulingOptions from './SchedulingOptions';
import PostStatusModal from '../PostStatusModal';

export type PostType =
  | 'post'
  | 'story'
  | 'reel'
  | 'thread'
  | 'carousel'
  | 'article'
  | 'poll'
  | 'event';

  interface NewPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPostSubmit: (statuses: Array<{
      id: string;
      platform: string;
      status: 'published' | 'scheduled' | 'failed' | 'processing';
      error?: string;
      publishedAt?: string;
      scheduledFor?: string;
    }>) => void;
    onSave: (post: Post) => void;
    initialData?: Post;
    connectedAccounts: SocialAccount[];
  }
export default function NewPostModal({
  isOpen,
  onClose,
  onPostSubmit,
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
  const [threadContent, setThreadContent] = useState<string[]>(['']);
  const [threadMedia, setThreadMedia] = useState<Record<string, MediaFile[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
const [platformStatuses, setPlatformStatuses] = useState<Array<{
  id: string;
  platform: string;
  status: 'published' | 'scheduled' | 'failed' | 'processing';
  error?: string;
  publishedAt?: string;
  scheduledFor?: string;
}>>([]);

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

  // Use the file cleanup hook with disabled flag during submission
  const { cleanupFiles, isCleaningUp, isFilePendingCleanup } = useFileCleanup({
    files: uploadedFiles,
    onCleanup: async (fileIds) => {
      for (const id of fileIds) {
        await deleteFile(id);
      }
    },
    disabled: isSubmitting // Disable cleanup during submission
  });

  const handleMediaUpload = async (files: File[], threadId?: string) => {
    try {
      setUploadingFiles(true);
      const uploadedMediaFiles = await Promise.all(
        files.map(file => uploadMedia(file))
      );

      if (threadId) {
        // Update thread-specific media
        setThreadMedia(prev => ({
          ...prev,
          [threadId]: [...(prev[threadId] || []), ...uploadedMediaFiles]
        }));
      } else {
        // Update general media
        setUploadedFiles(prev => [...prev, ...uploadedMediaFiles]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload media');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleMediaRemove = (file: MediaFile, threadId?: string) => {
    if (threadId) {
      // Remove from thread-specific media
      setThreadMedia(prev => ({
        ...prev,
        [threadId]: prev[threadId]?.filter(f => f.id !== file.id) || []
      }));
    } else {
      // Remove from general media
      setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
    }
    deleteFile(file.id);
  };

  const handleBack = () => {
    if (step === 'type') {
      setStep('platform');
    } else if (step === 'content') {
      setStep('type');
    }
  };
  useEffect(() => {
    if (!isOpen) {
      setUploadedFiles([]);
      setPostData({
        caption: '',
        scheduledDate: defaultDate.toISOString().split('T')[0],
        scheduledTime: defaultDate.toTimeString().slice(0, 5),
        hashtags: '',
        visibility: 'public',
        platformSpecificData: {},
      });
      setSelectedPlatforms([]);
      setSelectedPostType('post');
      setStep('platform');
      setError(null);
    }
  }, [isOpen]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
  
    if (!validateForm()) {
      return;
    }
  
    try {
      setIsSubmitting(true);
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
  
      const mediaFiles = uploadedFiles.map(file => file.id);
  
      // Format thread content - ensure it's not empty
      const formattedThreadContent = selectedPostType === 'thread' ? 
        threadContent.filter(content => content.trim()) : [];
  
      // Ensure we have thread content for thread posts
      if (selectedPostType === 'thread' && formattedThreadContent.length === 0) {
        throw new Error('Thread content is required');
      }
  
      const requestBody = {
        caption: selectedPostType === 'thread' ? formattedThreadContent[0] : postData.caption,
        scheduledDate: scheduledDateTime.toISOString(),
        platforms: selectedPlatforms.map(id => {
          const platform = connectedAccounts.find(acc => acc.id === id);
          return {
            id,
            platform: platform?.platform || '',
            postType: selectedPostType,
            settings: {
              ...postData.platformSpecificData[id],
              // Include thread content for thread type
              threadContent: selectedPostType === 'thread' ? formattedThreadContent : undefined
            }
          };
        }),
        hashtags: postData.hashtags,
        visibility: postData.visibility,
        mediaFiles,
        // Include thread content at the top level as well
        threadContent: selectedPostType === 'thread' ? formattedThreadContent : undefined,
        publishNow
      };
  
      console.log('Request body:', JSON.stringify(requestBody, null, 2)); // Better debug logging
  
      const response = await fetch(`${APP_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to create post');
      }
  
      const responseData = await response.json();
      const statuses = responseData.platforms.map((platform: any) => ({
        id: platform.id,
        platform: platform.platform,
        status: platform.status === 'published' ? 'published' 
          : platform.status === 'scheduled' ? 'scheduled'
          : platform.status === 'failed' ? 'failed'
          : 'processing',
        error: platform.error,
        publishedAt: platform.publishedAt,
        scheduledFor: platform.scheduledFor
      }));
  
      onPostSubmit(statuses);
      onClose();
    } catch (err) {
      console.error('Post creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Update the validateForm function:
  
  const validateForm = () => {
    // For Twitter threads, validate thread content
    if (selectedPostType === 'thread') {
      const validThreads = threadContent.filter(content => content.trim());
      if (validThreads.length === 0) {
        toast.error('At least one tweet in the thread is required');
        return false;
      }
      
      // Validate each thread's content length
      const invalidThreads = validThreads.filter(content => content.length > 280);
      if (invalidThreads.length > 0) {
        toast.error('One or more tweets exceed the 280 character limit');
        return false;
      }
    } else if (!postData.caption.trim() && selectedPostType !== 'story') {
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
  
    return true;
  };  
  

  // Modify handleClose to only cleanup files for immediate posts
  const handleClose = async () => {
    if (isSubmitting || isCleaningUp) return;
  
    try {
      // Only cleanup files if we're not in the middle of submitting and it's not a scheduled post
      if (!isSubmitting && uploadedFiles.length > 0 && publishNow) {
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
      // Clear thread-specific data
      setThreadContent(['']);
      setThreadMedia({});
      onClose();
    }
  };

  // Handle individual file removal
  const handleFileRemove = async (file: MediaFile) => {
    try {
      await deleteFile(file.id);
      setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
      toast.success('File removed successfully');
    } catch (error) {
      console.error('Failed to remove file:', error);
      toast.error('Failed to remove file. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal for Post Creation/Editing */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl flex flex-col shadow-xl max-h-[90vh]">
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
                  onBack={handleBack}
                  onNext={() => setStep('content')}
                  connectedAccounts={connectedAccounts}
                />
              )}
              {step === 'content' && (
                <>
                  <PostContent
                    postType={selectedPostType}
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
                    onBack={() => setStep('type')}
                    threadContent={threadContent}
                    onThreadChange={setThreadContent}
                    threadMedia={threadMedia}
                  />
  
                  <SchedulingOptions
                    publishNow={publishNow}
                    setPublishNow={setPublishNow}
                    scheduledDate={postData.scheduledDate}
                    scheduledTime={postData.scheduledTime}
                    onDateChange={(e) => setPostData({ ...postData, scheduledDate: e.target.value })}
                    onTimeChange={(e) => setPostData({ ...postData, scheduledTime: e.target.value })}
                  />
                </>
              )}
            </div>
          </div>
  
          {/* Footer */}
          {step === 'content' && (
            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white rounded-b-2xl">
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
  
      {/* Post Status Modal */}
      <PostStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        platforms={platformStatuses}
        scheduledDate={postData.scheduledDate}
        onRetry={async (platformId) => {
          try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token');
  
            const response = await fetch(`${APP_URL}/api/posts/retry/${platformId}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
  
            if (!response.ok) {
              throw new Error('Failed to retry post');
            }
  
            // Update the status for this platform
            setPlatformStatuses(prev => prev.map(p => 
              p.id === platformId 
                ? { ...p, status: 'processing', error: undefined }
                : p
            ));
  
            // Fetch updated status after a short delay
            setTimeout(async () => {
              const statusResponse = await fetch(`${APP_URL}/api/posts/status/${platformId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              if (statusResponse.ok) {
                const updatedStatus = await statusResponse.json();
                setPlatformStatuses(prev => prev.map(p => 
                  p.id === platformId ? { ...p, ...updatedStatus } : p
                ));
              }
            }, 2000);
          } catch (error) {
            console.error('Failed to retry post:', error);
            setError(error instanceof Error ? error.message : 'Failed to retry post');
          }
        }}
      />
    </>
  );
}