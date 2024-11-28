import { useState, useCallback } from 'react';
import { uploadService } from '../service/mediaService';
import type { MediaFile } from '../types/media';

interface UseMediaUploadReturn {
  uploadFiles: (
    files: File[],
    callbacks?: {
      onProgress?: (completed: number, total: number, progress: number) => void;
      onComplete?: () => void;
      onError?: (error: Error) => void;
    }
  ) => Promise<MediaFile[]>;
  isUploading: boolean;
  error: Error | null;
}

export function useMediaUpload(): UseMediaUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadFiles = useCallback(async (
    files: File[],
    callbacks?: {
      onProgress?: (completed: number, total: number, progress: number) => void;
      onComplete?: () => void;
      onError?: (error: Error) => void;
    }
  ): Promise<MediaFile[]> => {
    console.log(`Starting upload for ${files.length} files`);
    setIsUploading(true);
    setError(null);

    try {
      let completedFiles = 0;
      const totalFiles = files.length;

      const uploads = files.map(async (file) => {
        try {
          const result = await uploadService.uploadFile(file, (progress) => {
            completedFiles = progress === 100 ? completedFiles + 1 : completedFiles;
            const totalProgress = ((completedFiles / totalFiles) * 100) + 
              ((progress / 100) * (100 / totalFiles));
            
            callbacks?.onProgress?.(completedFiles, totalFiles, totalProgress);
          });
          return result;
        } catch (error) {
          console.error(`Upload failed for ${file.name}:`, error);
          throw error;
        }
      });

      const results = await Promise.all(uploads);
      callbacks?.onComplete?.();
      return results;
    } catch (err) {
      const error = err as Error;
      console.error('Upload failed:', error);
      setError(error);
      callbacks?.onError?.(error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    uploadFiles,
    isUploading,
    error
  };
}