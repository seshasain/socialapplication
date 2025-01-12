import { useEffect, useRef, useCallback } from 'react';
import { MediaFile } from '../types/media';
import { toast } from 'react-toastify';

interface UseFileCleanupProps {
  files: MediaFile[];
  onCleanup: (fileIds: string[]) => Promise<void>;
  onError?: (error: Error) => void;
  silent?: boolean;
  disabled?: boolean; // New prop to disable cleanup
}

export function useFileCleanup({ 
  files, 
  onCleanup,
  onError,
  silent = false,
  disabled = false // Default to enabled
}: UseFileCleanupProps) {
  const filesRef = useRef<MediaFile[]>([]);
  const cleanupInProgress = useRef(false);
  const unmounting = useRef(false);
  const cleanedUpFiles = useRef(new Set<string>());
  const pendingCleanup = useRef<MediaFile[]>([]);

  // Keep filesRef updated with latest files
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Cleanup function with additional checks
  const cleanup = async (forcedCleanup = false) => {
    if (disabled && !forcedCleanup) return; // Skip cleanup if disabled unless forced
    if (cleanupInProgress.current || !filesRef.current.length) return;

    try {
      cleanupInProgress.current = true;
      
      // Get files that need cleanup
      const filesToCleanup = forcedCleanup 
        ? filesRef.current 
        : filesRef.current.filter(file => !cleanedUpFiles.current.has(file.id));
      
      if (filesToCleanup.length === 0) return;

      // Store files pending cleanup
      pendingCleanup.current = filesToCleanup;

      const fileIds = filesToCleanup.map(file => file.id);
      await onCleanup(fileIds);
      
      // Mark files as cleaned up
      fileIds.forEach(id => cleanedUpFiles.current.add(id));
      pendingCleanup.current = [];

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

  // Handle component unmount
  useEffect(() => {
    return () => {
      unmounting.current = true;
      // Force cleanup on unmount regardless of disabled state
      cleanup(true);
    };
  }, []);

  // Manual cleanup function
  const cleanupFiles = useCallback(async (fileIds: string[]) => {
    if (!fileIds.length || cleanupInProgress.current || disabled) return;

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
  }, [onCleanup, onError, silent, disabled]);

  // Check if a file is pending cleanup
  const isFilePendingCleanup = useCallback((fileId: string) => {
    return pendingCleanup.current.some(file => file.id === fileId);
  }, []);

  return {
    cleanupFiles,
    isCleaningUp: cleanupInProgress.current,
    isFilePendingCleanup,
    pendingCleanupCount: pendingCleanup.current.length
  };
}