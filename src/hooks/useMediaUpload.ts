import { useState, useCallback, useRef } from 'react';
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
  const completedFilesRef = useRef(0);
  const totalFilesRef = useRef(0);

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
    completedFilesRef.current = 0;
    totalFilesRef.current = files.length;

    try {
      const uploads = files.map(async (file) => {
        try {
          const result = await uploadService.uploadFile(file, (progress) => {
            // Update completed files count when a file is fully uploaded
            if (progress === 100) {
              completedFilesRef.current++;
            }

            // Calculate total progress including completed files and current progress
            const totalProgress = (
              ((completedFilesRef.current + (progress / 100)) / totalFilesRef.current) * 100
            );

            callbacks?.onProgress?.(
              completedFilesRef.current,
              totalFilesRef.current,
              Math.min(Math.round(totalProgress), 100)
            );
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
      completedFilesRef.current = 0;
      totalFilesRef.current = 0;
    }
  }, []);

  return {
    uploadFiles,
    isUploading,
    error
  };
}