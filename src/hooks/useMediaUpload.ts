import { useState, useCallback, useEffect } from 'react';
import { uploadService } from '../service/mediaService';
import type { 
  UploadProgress, 
  UploadResponse, 
  MediaFile 
} from '../types/media';

interface UseMediaUploadReturn {
  uploadFiles: (files: File[]) => Promise<MediaFile[]>;
  uploadProgress: Record<string, UploadProgress>;
  isUploading: boolean;
  error: Error | null;
  reset: () => void;
  cleanup: () => Promise<void>;
}

export function useMediaUpload(): UseMediaUploadReturn {
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  console.log('useFileUpload hook initialized');

  const updateProgress = useCallback((fileId: string, progress: number, status: UploadProgress['status'] = 'uploading', error?: string) => {
    console.log(`Updating progress for ${fileId}: ${progress}%, status: ${status}`);
    setUploadProgress(prev => ({
      ...prev,
      [fileId]: {
        id: fileId,
        progress,
        status,
        ...(error && { error })
      }
    }));
  }, []);

  const uploadFiles = useCallback(async (files: File[]): Promise<MediaFile[]> => {
    console.log(`Starting upload for ${files.length} files`);
    setIsUploading(true);
    setError(null);

    try {
      const initialProgress = files.reduce((acc, file) => ({
        ...acc,
        [file.name]: {
          id: file.name,
          progress: 0,
          status: 'pending' as const
        }
      }), {});
      setUploadProgress(initialProgress);

      const results = await uploadService.uploadMultipleFiles(
        files,
        {
          onProgress: (fileId, progress) => {
            console.log(`Progress update for ${fileId}: ${progress}%`);
            updateProgress(fileId, progress);
          },
          onComplete: (fileId) => {
            console.log(`Upload completed for ${fileId}`);
            updateProgress(fileId, 100, 'success');
          },
          onError: (fileId, error) => {
            console.error(`Upload error for ${fileId}:`, error);
            updateProgress(fileId, 0, 'error', error.message);
            setError(error);
          }
        }
      );

      console.log('All files uploaded successfully');
      return results;
    } catch (err) {
      const error = err as Error;
      console.error('Upload failed:', error);
      setError(error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [updateProgress]);

  const reset = useCallback(() => {
    console.log('Resetting upload state');
    setUploadProgress({});
    setIsUploading(false);
    setError(null);
  }, []);

  const cleanup = useCallback(async () => {
    console.log('Starting cleanup of pending uploads');
    try {
      await uploadService.cleanupPendingUploads();
      console.log('Cleanup completed successfully');
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }, []);

  useEffect(() => {
    return () => {
      console.log('useFileUpload hook cleanup');
      cleanup().catch(error => {
        console.error('Cleanup on unmount failed:', error);
      });
    };
  }, [cleanup]);

  return {
    uploadFiles,
    uploadProgress,
    isUploading,
    error,
    reset,
    cleanup
  };
}