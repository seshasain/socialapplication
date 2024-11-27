import { useState, useCallback } from 'react';
import { uploadService, UploadProgress, UploadResponse } from '../service/mediaService';


interface UseFileUploadReturn {
  uploadFiles: (files: File[]) => Promise<UploadResponse[]>;
  uploadProgress: Record<string, UploadProgress>;
  isUploading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useFileUpload(): UseFileUploadReturn {
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateProgress = useCallback((fileId: string, progress: number) => {
    setUploadProgress(prev => ({
      ...prev,
      [fileId]: {
        id: fileId,
        progress,
        status: progress === 100 ? 'success' : 'uploading'
      }
    }));
  }, []);

  const uploadFiles = useCallback(async (files: File[]): Promise<UploadResponse[]> => {
    setIsUploading(true);
    setError(null);

    try {
      // Initialize progress for each file
      const initialProgress = files.reduce((acc, file) => ({
        ...acc,
        [file.name]: {
          id: file.name,
          progress: 0,
          status: 'pending'
        }
      }), {});
      setUploadProgress(initialProgress);

      const results = await uploadService.uploadMultipleFiles(
        files,
        // Progress callback
        (fileId, progress) => {
          updateProgress(fileId, progress);
        },
        // Complete callback
        (fileId) => {
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: {
              ...prev[fileId],
              progress: 100,
              status: 'success'
            }
          }));
        },
        // Error callback
        (fileId, error) => {
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: {
              ...prev[fileId],
              status: 'error',
              error: error.message
            }
          }));
        }
      );

      return results;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [updateProgress]);

  const reset = useCallback(() => {
    setUploadProgress({});
    setIsUploading(false);
    setError(null);
  }, []);

  return {
    uploadFiles,
    uploadProgress,
    isUploading,
    error,
    reset
  };
}