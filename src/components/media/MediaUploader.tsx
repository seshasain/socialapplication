import React, { useCallback, useState } from 'react';
import { Upload, X, Film, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { MediaFile } from '../../types/posts';
import { useFileUpload } from '../../hooks/useMediaUpload';
import FileUploadProgress from './FileUploadProgress';

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
  const { uploadFiles, uploadProgress, isUploading, error: uploadError } = useFileUpload();

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
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
      const uploadedFiles = await uploadFiles(acceptedFiles);
      onUpload(uploadedFiles);
    } catch (error) {
      console.error('Upload error:', error);
    }
  }, [maxFiles, existingFiles.length, onUpload, uploadFiles]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles: maxFiles - existingFiles.length,
    maxSize: 100 * 1024 * 1024, // 100MB
    disabled: isUploading
  });

  const renderPreview = (file: MediaFile) => {
    const isVideo = file.type?.startsWith('video/');

    return (
      <div key={file.id} className="relative group">
        <div className="aspect-square w-24 rounded-lg overflow-hidden border border-gray-200">
          {isVideo ? (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <Film className="w-8 h-8 text-gray-400" />
            </div>
          ) : (
            <img
              src={file.url}
              alt={file.filename}
              className="w-full h-full object-cover"
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
      </div>

      {(propError || dragError || uploadError) && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{propError || dragError || uploadError?.message}</span>
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <FileUploadProgress
              key={fileId}
              file={new File([], fileId)} // Temporary file object for display
              progress={progress}
            />
          ))}
        </div>
      )}

      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
          {existingFiles.map(renderPreview)}
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