import React from 'react';
import { X, CheckCircle, AlertCircle, Loader2, WifiOff, RefreshCw } from 'lucide-react';

interface FileUploadProgressProps {
  totalFiles: number;
  completedFiles: number;
  totalProgress: number;
  status: 'idle' | 'uploading' | 'complete' | 'error';
  error?: string;
  isProcessing?: boolean;
  queueLength?: number;
  hasFailedUploads?: boolean;
  onCancel?: () => void;
}

export default function FileUploadProgress({
  totalFiles,
  completedFiles,
  totalProgress,
  status,
  error,
  isProcessing,
  queueLength = 0,
  hasFailedUploads = false,
  onCancel
}: FileUploadProgressProps) {
  // Don't show progress if complete and not processing
  if (status === 'complete' && !isProcessing && queueLength === 0) return null;

  // Calculate the effective progress considering completed files and current upload
  const effectiveProgress = Math.min(
    Math.round((completedFiles / totalFiles) * 100 + (totalProgress / totalFiles)),
    100
  );

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          {status === 'error' || hasFailedUploads ? (
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          ) : status === 'uploading' || isProcessing ? (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-2" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
          )}
          <span className="font-medium text-gray-900">
            {isProcessing ? 'Processing Files' : 'Uploading Files'}
          </span>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Cancel upload"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            {queueLength > 0 ? (
              <span className="flex items-center">
                <WifiOff className="w-4 h-4 mr-1" />
                {queueLength} files queued
              </span>
            ) : (
              `${completedFiles} of ${totalFiles} files`
            )}
          </span>
          <span>{`${effectiveProgress}%`}</span>
        </div>

        <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full transition-all duration-300 rounded-full ${
              status === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${effectiveProgress}%` }}
          />
        </div>

        {hasFailedUploads && (
          <div className="flex items-center justify-between mt-2 text-sm">
            <span className="text-red-600">Some uploads failed</span>
            <button
              onClick={onCancel}
              className="flex items-center text-blue-600 hover:text-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </button>
          </div>
        )}
        {error && (
          <p className="text-sm text-red-600 mt-2">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}