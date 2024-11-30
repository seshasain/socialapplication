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

  // Keep filesRef updated with latest files
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Handle cleanup on unmount and beforeunload
  useEffect(() => {
    // Flag for tracking unmounting state
    unmounting.current = false;

    // Cleanup function
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
        console.error('Failed to cleanup files:', error);
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

    // Handle tab close, refresh, etc.
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (filesRef.current.length > 0) {
        cleanup();
        // Show confirmation dialog if files are being uploaded
        event.preventDefault();
        event.returnValue = '';
      }
    };

    // Handle visibility change (tab hidden/visible)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && filesRef.current.length > 0) {
        cleanup();
      }
    };

    // Handle offline state
    const handleOffline = () => {
      if (filesRef.current.length > 0) {
        cleanup();
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('offline', handleOffline);

    // Cleanup on unmount
    return () => {
      unmounting.current = true;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('offline', handleOffline);
      cleanup();
    };
  }, [onCleanup, onError, silent]);

  // Manual cleanup function
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