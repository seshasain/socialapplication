import { FileValidationError } from '../types/errors';

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/x-icon'
];

export const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-msvideo'
];

export function validateFile(file: File | { type: string; size: number; name?: string }): void {
  if (!file) {
    throw new FileValidationError('No file provided');
  }

  // Log file information for debugging
  console.log('Validating file:', {
    name: 'name' in file ? file.name : undefined,
    type: file.type,
    size: file.size
  });

  // Handle files without a MIME type by checking extension
  if (!file.type || file.type === 'image' || file.type === 'video') {
    if ('name' in file && file.name) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'mp4', 'mov', 'webm', 'avi'].includes(extension)) {
        return; // Accept file based on extension
      }
    }
    throw new FileValidationError('File type not detected');
  }

  if (!isAcceptedFileType(file.type)) {
    throw new FileValidationError(`File type "${file.type}" is not supported`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new FileValidationError(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
  }
}

export function isAcceptedFileType(type: string): boolean {
  // Normalize MIME type to lowercase
  const normalizedType = type.toLowerCase();
  
  // Handle generic image/video types
  if (normalizedType === 'image' || normalizedType === 'video') {
    return true;
  }
  
  return [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES].some(
    acceptedType => normalizedType === acceptedType.toLowerCase()
  );
}

export function getFileTypeCategory(type: string): 'image' | 'video' | 'unknown' {
  const normalizedType = type.toLowerCase();
  if (normalizedType === 'image' || ACCEPTED_IMAGE_TYPES.some(t => normalizedType === t.toLowerCase())) return 'image';
  if (normalizedType === 'video' || ACCEPTED_VIDEO_TYPES.some(t => normalizedType === t.toLowerCase())) return 'video';
  return 'unknown';
}