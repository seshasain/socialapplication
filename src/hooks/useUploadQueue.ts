import { useState, useCallback, useRef, useEffect } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { toast } from 'react-toastify';

interface QueuedUpload {
  id: string;
  file: File;
  retryCount: number;
  lastAttempt: number;
}

interface UseUploadQueueProps {
  maxRetries?: number;
  retryDelay?: number;
  onUploadSuccess?: (fileId: string) => void;
  onUploadError?: (fileId: string, error: Error) => void;
}

export function useUploadQueue({
  maxRetries = 3,
  retryDelay = 5000,
  onUploadSuccess,
  onUploadError
}: UseUploadQueueProps = {}) {
  const [queue, setQueue] = useState<QueuedUpload[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isOnline, wasOffline } = useNetworkStatus();
  const processingRef = useRef(false);
  const queueRef = useRef<QueuedUpload[]>([]);

  // Keep queueRef in sync with queue state
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const processQueue = useCallback(async () => {
    if (processingRef.current || !isOnline || queueRef.current.length === 0) return;

    processingRef.current = true;
    setIsProcessing(true);

    try {
      const currentQueue = [...queueRef.current];
      const now = Date.now();

      for (const item of currentQueue) {
        if (item.retryCount >= maxRetries) {
          setQueue(prev => prev.filter(i => i.id !== item.id));
          onUploadError?.(item.id, new Error('Max retries exceeded'));
          continue;
        }

        if (now - item.lastAttempt < retryDelay) {
          continue;
        }

        try {
          const formData = new FormData();
          formData.append('file', item.file);

          const response = await fetch('/api/media/upload', {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          setQueue(prev => prev.filter(i => i.id !== item.id));
          onUploadSuccess?.(item.id);
        } catch (error) {
          setQueue(prev =>
            prev.map(i =>
              i.id === item.id
                ? {
                    ...i,
                    retryCount: i.retryCount + 1,
                    lastAttempt: Date.now()
                  }
                : i
            )
          );
        }
      }
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [isOnline, maxRetries, retryDelay, onUploadSuccess, onUploadError]);

  // Process queue when online or after reconnecting
  useEffect(() => {
    if (isOnline && (wasOffline || queue.length > 0)) {
      processQueue();
    }
  }, [isOnline, wasOffline, queue.length, processQueue]);

  const addToQueue = useCallback((file: File) => {
    const queueItem: QueuedUpload = {
      id: Math.random().toString(36).substring(7),
      file,
      retryCount: 0,
      lastAttempt: 0
    };

    setQueue(prev => [...prev, queueItem]);
    return queueItem.id;
  }, []);

  const removeFromQueue = useCallback((fileId: string) => {
    setQueue(prev => prev.filter(item => item.id !== fileId));
  }, []);   

  return {
    addToQueue,
    removeFromQueue,
    isProcessing,
    queueLength: queue.length,
    hasFailedUploads: queue.some(item => item.retryCount > 0)
  };
}