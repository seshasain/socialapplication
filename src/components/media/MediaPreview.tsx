import React from 'react';
import { X, Film, AlertCircle } from 'lucide-react';
import { MediaFile } from '../../types/posts';

interface MediaPreviewProps {
  file: MediaFile;
  onRemove: (file: MediaFile) => void;
}

export default function MediaPreview({ file, onRemove }: MediaPreviewProps) {
  console.log('Rendering MediaPreview for file:', file);

  const isVideo = file.type.startsWith('video/');
  const [previewError, setPreviewError] = React.useState(false);

  const handleError = () => {
    console.error(`Failed to load preview for file: ${file.filename}`);
    setPreviewError(true);
  };

  const handleRemove = () => {
    console.log(`Removing file: ${file.filename}`);
    onRemove(file);
  };

  if (previewError) {
    return (
      <div className="relative group aspect-square w-24 rounded-lg overflow-hidden border border-red-200 bg-red-50 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <button
          onClick={handleRemove}
          className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
          title="Remove file"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative group">
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
            onError={handleError}
          />
        )}
      </div>
      <button
        onClick={handleRemove}
        className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
        title="Remove file"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}