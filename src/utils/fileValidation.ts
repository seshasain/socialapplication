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

  // Get proper MIME type
  let mimeType = file.type;
  if (!mimeType || mimeType === 'image' || mimeType === 'video') {
    if ('name' in file && file.name) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          break;
        case 'png':
          mimeType = 'image/png';
          break;
        case 'gif':
          mimeType = 'image/gif';
          break;
        case 'webp':
          mimeType = 'image/webp';
          break;
        case 'svg':
          mimeType = 'image/svg+xml';
          break;
        case 'ico':
          mimeType = 'image/x-icon';
          break;
        case 'mp4':
          mimeType = 'video/mp4';
          break;
        case 'mov':
          mimeType = 'video/quicktime';
          break;
        case 'webm':
          mimeType = 'video/webm';
          break;
        case 'avi':
          mimeType = 'video/x-msvideo';
          break;
        default:
          throw new FileValidationError('Unsupported file type');
      }
    } else {
      throw new FileValidationError('File type not detected');
    }
  }

  if (!isAcceptedFileType(mimeType)) {
    throw new FileValidationError(`File type "${mimeType}" is not supported`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new FileValidationError(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
  }
  // Attach the proper MIME type to the file object if it's a File instance
  if (file instanceof File && file.type !== mimeType) {
    Object.defineProperty(file, 'type', {
      writable: true,
      value: mimeType
    });
  }
}
export function isAcceptedFileType(type: string): boolean {
  return [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES].includes(type);
}
export function getFileTypeCategory(type: string): 'image' | 'video' | 'unknown' {
  if (ACCEPTED_IMAGE_TYPES.includes(type)) return 'image';
  if (ACCEPTED_VIDEO_TYPES.includes(type)) return 'video';
  return 'unknown';
}