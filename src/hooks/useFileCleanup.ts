// src/hooks/useFileCleanup.ts

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
  const cleanedUpFiles = useRef(new Set<string>());

  // Keep filesRef updated with latest files
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Cleanup function
  const cleanup = async () => {
    if (cleanupInProgress.current || !filesRef.current.length) return;

    try {
      cleanupInProgress.current = true;
      // Only cleanup files that haven't been cleaned up yet
      const filesToCleanup = filesRef.current.filter(file => !cleanedUpFiles.current.has(file.id));
      
      if (filesToCleanup.length === 0) return;

      const fileIds = filesToCleanup.map(file => file.id);
      await onCleanup(fileIds);
      
      // Mark files as cleaned up
      fileIds.forEach(id => cleanedUpFiles.current.add(id));

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

  useEffect(() => {
    unmounting.current = false;

    // Handle tab close, refresh, etc.
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (filesRef.current.length > 0) {
        cleanup();
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

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('offline', handleOffline);

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
      // Only cleanup files that haven't been cleaned up yet
      const filesToCleanup = fileIds.filter(id => !cleanedUpFiles.current.has(id));
      
      if (filesToCleanup.length === 0) return;

      await onCleanup(filesToCleanup);
      
      // Mark files as cleaned up
      filesToCleanup.forEach(id => cleanedUpFiles.current.add(id));

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
