// src/components/media/MediaUploader.tsx
import React, { useCallback, useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Film, Loader2, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { MediaFile } from '../../types/posts';
import { APP_URL } from '../../config/api';

interface MediaUploaderProps {
  onUpload: (files: File[]) => void;
  onRemove: (file: File | MediaFile) => void;
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
  error
}: MediaUploaderProps) {
  const [previewFiles, setPreviewFiles] = useState<{ file: File; previewUrl: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewFiles.forEach(({ previewUrl }) => {
        URL.revokeObjectURL(previewUrl);
      });
    };
  }, []);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setDragError(null);

    if (rejectedFiles.length > 0) {
      setDragError('Some files were rejected. Please check file types and sizes.');
      return;
    }

    const remainingSlots = Math.max(0, maxFiles - (existingFiles.length + previewFiles.length));
    if (acceptedFiles.length > remainingSlots) {
      setDragError(`You can only upload ${remainingSlots} more file(s)`);
      acceptedFiles = acceptedFiles.slice(0, remainingSlots);
    }

    const validFiles = acceptedFiles.filter(file => {
      const isValidType = acceptedFileTypes.some(type => {
        const [category, ext] = type.split('/');
        return ext === '*' 
          ? file.type.startsWith(category)
          : file.type === type;
      });
      const isValidSize = file.size <= 100 * 1024 * 1024; // 100MB
      return isValidType && isValidSize;
    });

    if (validFiles.length !== acceptedFiles.length) {
      setDragError('Some files were rejected due to invalid type or size');
    }

    if (validFiles.length > 0) {
      const newPreviewFiles = validFiles.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }));
      setPreviewFiles(prev => [...prev, ...newPreviewFiles]);
      onUpload(validFiles);
    }
  }, [maxFiles, existingFiles.length, previewFiles.length, onUpload, acceptedFileTypes]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles: maxFiles - (existingFiles.length + previewFiles.length),
    maxSize: 100 * 1024 * 1024,
    disabled: uploading
  });

  const handleRemove = (fileToRemove: File | MediaFile) => {
    if ('url' in fileToRemove) {
      onRemove(fileToRemove);
    } else {
      const previewFile = previewFiles.find(pf => pf.file === fileToRemove);
      if (previewFile) {
        URL.revokeObjectURL(previewFile.previewUrl);
        setPreviewFiles(prev => prev.filter(pf => pf.file !== fileToRemove));
      }
      onRemove(fileToRemove);
    }
  };

  const renderPreview = (item: MediaFile | { file: File; previewUrl: string }) => {
    const isExistingFile = 'url' in item;
    const file = isExistingFile ? item : item.file;
    const previewUrl = isExistingFile ? `${APP_URL}${item.url}` : item.previewUrl;
    const isVideo = file.type?.startsWith('video/');
    const name = isExistingFile ? (item as MediaFile).filename : file.name;

    return (
      <div key={isExistingFile ? (item as MediaFile).id : file.name} className="relative group">
        <div className="aspect-square w-24 rounded-lg overflow-hidden border border-gray-200">
          {isVideo ? (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <Film className="w-8 h-8 text-gray-400" />
            </div>
          ) : (
            <img
              src={previewUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <button
          onClick={() => handleRemove(isExistingFile ? item as MediaFile : file)}
          className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
          title="Remove file"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

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
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="mt-2 text-sm text-gray-600">Uploading...</p>
          </div>
        ) : (
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
          </div>
        )}
      </div>

      {(error || dragError) && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error || dragError}</span>
        </div>
      )}

      {(existingFiles.length > 0 || previewFiles.length > 0) && (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
          {existingFiles.map(renderPreview)}
          {previewFiles.map(renderPreview)}
        </div>
      )}

      {maxFiles > 0 && (
        <p className="text-xs text-gray-500">
          {existingFiles.length + previewFiles.length} of {maxFiles} files used
        </p>
      )}
    </div>
  );
}
