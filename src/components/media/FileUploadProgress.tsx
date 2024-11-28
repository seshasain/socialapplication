import React from 'react';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FileUploadProgressProps {
  totalFiles: number;
  completedFiles: number;
  totalProgress: number;
  status: 'idle' | 'uploading' | 'complete' | 'error';
  error?: string;
  onCancel?: () => void;
}

export default function FileUploadProgress({
  totalFiles,
  completedFiles,
  totalProgress,
  status,
  error,
  onCancel
}: FileUploadProgressProps) {
  if (status === 'complete') return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          {status === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          ) : status === 'uploading' ? (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-2" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
          )}
          <span className="font-medium text-gray-900">
            {status === 'error' ? 'Upload Failed' : 'Uploading Files'}
          </span>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>{`${completedFiles} of ${totalFiles} files`}</span>
          <span>{`${Math.round(totalProgress)}%`}</span>
        </div>

        <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full transition-all duration-300 rounded-full ${
              status === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${totalProgress}%` }}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 mt-2">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}