import { useEffect, useRef, useCallback } from 'react';
import { MediaFile } from '../types/media';
import { toast } from 'react-toastify';

interface UseFileCleanupProps {
  files: MediaFile[];
  onCleanup: (fileIds: string[]) => Promise<void>;
}

export function useFileCleanup({ files, onCleanup }: UseFileCleanupProps) {
  const filesRef = useRef<MediaFile[]>([]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    // Cleanup files when component unmounts
    return () => {
      if (filesRef.current.length > 0) {
        const fileIds = filesRef.current.map(file => file.id);
        onCleanup(fileIds).catch(error => {
          console.error('Failed to cleanup files on unmount:', error);
          // We can't show toast here as component is unmounting
        });
      }
    };
  }, [onCleanup]);

  const cleanupFiles = useCallback(async (fileIds: string[]) => {
    if (!fileIds.length) return;

    try {
      await onCleanup(fileIds);
    } catch (error) {
      console.error('Failed to cleanup files:', error);
      toast.error('Failed to cleanup files. Please try again.');
      throw error;
    }
  }, [onCleanup]);

  return {
    cleanupFiles
  };
}