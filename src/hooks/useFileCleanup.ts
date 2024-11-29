import { useEffect, useRef, useCallback } from 'react';
import { MediaFile } from '../types/media';
import { toast } from 'react-toastify';

interface UseFileCleanupProps {
  files: MediaFile[];
  onCleanup: (fileIds: string[]) => Promise<void>;
  onError?: (error: Error) => void;
  silent?: boolean;
}

export function useFileCleanup({ 
  files, 
  onCleanup,
  onError,
  silent = false
}: UseFileCleanupProps) {
  const filesRef = useRef<MediaFile[]>([]);
  const cleanupInProgress = useRef(false);
  const unmounting = useRef(false);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    return () => {
      unmounting.current = true;
      const cleanup = async () => {
        if (cleanupInProgress.current || !filesRef.current.length) return;

        try {
          cleanupInProgress.current = true;
          const fileIds = filesRef.current.map(file => file.id);
          await onCleanup(fileIds);
          if (!silent && !unmounting.current) {
            toast.success('Files cleaned up successfully');
          }
        } catch (error) {
          console.error('Failed to cleanup files on unmount:', error);
          if (!unmounting.current) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to cleanup files';
            if (!silent) {
              toast.error(errorMessage);
            }
            onError?.(error instanceof Error ? error : new Error(errorMessage));
          }
        } finally {
          cleanupInProgress.current = false;
        }
      };

      cleanup();
    };
  }, [onCleanup, onError, silent]);

  const cleanupFiles = useCallback(async (fileIds: string[]) => {
    if (!fileIds.length || cleanupInProgress.current) return;

    try {
      cleanupInProgress.current = true;
      await onCleanup(fileIds);
      if (!silent && !unmounting.current) {
        toast.success('Files cleaned up successfully');
      }
    } catch (error) {
      console.error('Failed to cleanup files:', error);
      if (!unmounting.current) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to cleanup files';
        if (!silent) {
          toast.error(errorMessage);
        }
        onError?.(error instanceof Error ? error : new Error(errorMessage));
      }
      throw error;
    } finally {
      cleanupInProgress.current = false;
    }
  }, [onCleanup, onError, silent]);

  return {
    cleanupFiles,
    isCleaningUp: cleanupInProgress.current
  };
}