import React from 'react';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { UploadProgress } from '../../service/mediaService';
interface FileUploadProgressProps {
  file: File;
  progress: UploadProgress;
  onRemove?: () => void;
}

export default function FileUploadProgress({ file, progress, onRemove }: FileUploadProgressProps) {
  return (
    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900 truncate">
            {file.name}
          </span>
          {onRemove && progress.status !== 'uploading' && (
            <button
              onClick={onRemove}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full transition-all duration-300 rounded-full ${
              progress.status === 'error'
                ? 'bg-red-500'
                : progress.status === 'success'
                ? 'bg-green-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${progress.progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center">
            {progress.status === 'uploading' && (
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin mr-2" />
            )}
            {progress.status === 'success' && (
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            )}
            {progress.status === 'error' && (
              <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
            )}
            <span className={`text-sm ${
              progress.status === 'error'
                ? 'text-red-600'
                : progress.status === 'success'
                ? 'text-green-600'
                : 'text-gray-500'
            }`}>
              {progress.status === 'error'
                ? progress.error || 'Upload failed'
                : progress.status === 'success'
                ? 'Upload complete'
                : 'Uploading...'}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {progress.progress}%
          </span>
        </div>
      </div>
    </div>
  );
}