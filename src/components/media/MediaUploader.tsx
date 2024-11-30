import React, { useCallback, useState } from 'react';
import { Upload, X, Film, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { MediaFile } from '../../types/media';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { useUploadQueue } from '../../hooks/useUploadQueue';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import FileUploadProgress from './FileUploadProgress';
import { validateFile } from '../../utils/fileValidation';

interface MediaUploaderProps {
  onUpload: (files: MediaFile[]) => void;
  onRemove: (file: MediaFile) => void;
  existingFiles?: MediaFile[];
  maxFiles?: number;
  acceptedFileTypes?: string[];
  error?: string;
}

export default function MediaUploader({
  onUpload,
  onRemove,
  existingFiles = [],
  maxFiles = 10,
  acceptedFileTypes = ['image/*', 'video/*'],
  error: propError
}: MediaUploaderProps) {
  const [dragError, setDragError] = useState<string | null>(null);
  const { uploadFiles, isUploading, error: uploadError } = useMediaUpload();
  const [uploadProgress, setUploadProgress] = useState({
    totalFiles: 0,
    completedFiles: 0,
    totalProgress: 0,
    status: 'idle' as 'idle' | 'uploading' | 'complete' | 'error'
  });

  const { isOnline } = useNetworkStatus();
  const { 
    addToQueue, 
    removeFromQueue, 
    isProcessing, 
    queueLength,
    hasFailedUploads 
  } = useUploadQueue({
    onUploadSuccess: (fileId) => {
      // Handle successful upload from queue
      setUploadProgress(prev => ({
        ...prev,
        completedFiles: prev.completedFiles + 1
      }));
    },
    onUploadError: (fileId, error) => {
      // Handle failed upload from queue
      setDragError(`Upload failed: ${error.message}`);
    }
  });

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    if (!acceptedFiles?.length) {
      setDragError('No valid files were provided');
      return;
    }

    setDragError(null);

    if (rejectedFiles.length > 0) {
      setDragError('Some files were rejected. Please check file types and sizes.');
      return;
    }

    const remainingSlots = Math.max(0, maxFiles - existingFiles.length);
    if (acceptedFiles.length > remainingSlots) {
      setDragError(`You can only upload ${remainingSlots} more file(s)`);
      acceptedFiles = acceptedFiles.slice(0, remainingSlots);
    }

    try {
      acceptedFiles.forEach(validateFile);
      
      setUploadProgress({
        totalFiles: acceptedFiles.length,
        completedFiles: 0,
        totalProgress: 0,
        status: 'uploading'
      });

      if (!isOnline) {
        // Add files to queue if offline
        acceptedFiles.forEach(file => {
          addToQueue(file);
        });
        setDragError('You are offline. Files will be uploaded when connection is restored.');
        return;
      }

      const uploadedFiles = await uploadFiles(acceptedFiles, {
        onProgress: (completed, total, progress) => {
          setUploadProgress(prev => ({
            ...prev,
            completedFiles: completed,
            totalProgress: progress
          }));
        },
        onComplete: () => {
          setUploadProgress(prev => ({
            ...prev,
            status: 'complete'
          }));
        },
        onError: () => {
          setUploadProgress(prev => ({
            ...prev,
            status: 'error'
          }));
        }
      });

      if (uploadedFiles && uploadedFiles.length > 0) {
        onUpload(uploadedFiles);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setDragError(error instanceof Error ? error.message : 'Failed to upload files');
      
      if (!isOnline) {
        // Add failed uploads to queue
        acceptedFiles.forEach(file => {
          addToQueue(file);
        });
      }
    }
  }, [maxFiles, existingFiles.length, onUpload, uploadFiles, isOnline, addToQueue]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles: maxFiles - existingFiles.length,
    maxSize: 100 * 1024 * 1024, // 100MB
    disabled: isUploading
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-400 bg-blue-50' : 
          isDragReject ? 'border-red-400 bg-red-50' :
          'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">
            {isDragActive ? (
              'Drop your files here'
            ) : (
              <>
                Drag and drop your media files here, or{' '}
                <span className="text-blue-600">browse</span>
              </>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supports images and videos up to 100MB
          </p>
          {!isOnline && (
            <div className="flex items-center mt-2 text-yellow-600">
              <WifiOff className="w-4 h-4 mr-1" />
              <span className="text-sm">Offline mode - Files will upload when connection is restored</span>
            </div>
          )}
          {queueLength > 0 && (
            <div className="mt-2 text-sm text-blue-600">
              {queueLength} file(s) queued for upload
            </div>
          )}
        </div>
      </div>

      {(propError || dragError || uploadError) && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{propError || dragError || uploadError?.message}</span>
        </div>
      )}

      {(uploadProgress.status !== 'idle' || isProcessing) && (
        <FileUploadProgress
          totalFiles={uploadProgress.totalFiles}
          completedFiles={uploadProgress.completedFiles}
          totalProgress={uploadProgress.totalProgress}
          status={uploadProgress.status}
          error={uploadError?.message}
          isProcessing={isProcessing}
          queueLength={queueLength}
          hasFailedUploads={hasFailedUploads}
        />
      )}

      {existingFiles.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
          {existingFiles.map((file) => (
            <div key={file.id} className="relative group">
              <div className="aspect-square w-24 rounded-lg overflow-hidden border border-gray-200">
                {file.type?.startsWith('video/') ? (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <Film className="w-8 h-8 text-gray-400" />
                  </div>
                ) : (
                  <img
                    src={file.url}
                    alt={file.filename}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error(`Failed to load image: ${file.url}`);
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PGxpbmUgeDE9IjEyIiB5MT0iOCIgeDI9IjEyIiB5Mj0iMTIiLz48bGluZSB4MT0iMTIiIHkxPSIxNiIgeDI9IjEyLjAxIiB5Mj0iMTYiLz48L3N2Zz4=';
                    }}
                  />
                )}
              </div>
              <button
                onClick={() => onRemove(file)}
                className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {maxFiles > 0 && (
        <p className="text-xs text-gray-500">
          {existingFiles.length} of {maxFiles} files used
        </p>
      )}
    </div>
  );
}