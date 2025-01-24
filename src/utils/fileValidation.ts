import { FileValidationError } from '../types/errors';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const MAX_IMAGE_DIMENSIONS = { width: 4096, height: 4096 };
const MAX_VIDEO_DURATION = 300; // 5 minutes in seconds

interface ImageDimensions {
  width: number;
  height: number;
}

interface FileValidationResult {
  valid: boolean;
  type: 'image' | 'video';
  dimensions?: ImageDimensions;
  duration?: number;
  error?: string;
}

export async function validateFile(file: File): Promise<FileValidationResult> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new FileValidationError(
      `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    );
  }

  // Check file type
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    throw new FileValidationError(
      'Invalid file type. Supported formats: JPG, PNG, GIF, WEBP, MP4, MOV, WEBM'
    );
  }

  try {
    if (isImage) {
      const dimensions = await getImageDimensions(file);
      if (dimensions.width > MAX_IMAGE_DIMENSIONS.width || 
          dimensions.height > MAX_IMAGE_DIMENSIONS.height) {
        throw new FileValidationError(
          `Image dimensions exceed maximum limit of ${MAX_IMAGE_DIMENSIONS.width}x${MAX_IMAGE_DIMENSIONS.height}`
        );
      }

      return {
        valid: true,
        type: 'image',
        dimensions
      };
    } else {
      const duration = await getVideoDuration(file);
      if (duration > MAX_VIDEO_DURATION) {
        throw new FileValidationError(
          `Video duration exceeds maximum limit of ${MAX_VIDEO_DURATION} seconds`
        );
      }

      return {
        valid: true,
        type: 'video',
        duration
      };
    }
  } catch (error) {
    if (error instanceof FileValidationError) {
      throw error;
    }
    throw new FileValidationError('Failed to validate file');
  }
}

function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.onerror = () => {
      reject(new FileValidationError('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new FileValidationError('Failed to load video'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export async function compressImage(file: File, maxWidth = 2048): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new FileValidationError('Failed to compress image'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new FileValidationError('Failed to compress image'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.8
      );
    };

    img.onerror = () => {
      reject(new FileValidationError('Failed to load image for compression'));
    };

    img.src = URL.createObjectURL(file);
  });
}

export async function generateThumbnail(file: File, maxWidth = 400): Promise<string> {
  if (file.type.startsWith('image/')) {
    const blob = await compressImage(file, maxWidth);
    return URL.createObjectURL(blob);
  }

  if (file.type.startsWith('video/')) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadeddata = () => {
        video.currentTime = 1; // Seek to 1 second
      };
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new FileValidationError('Failed to generate thumbnail'));
          return;
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(video.src);
        
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new FileValidationError('Failed to generate video thumbnail'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  }

  throw new FileValidationError('Unsupported file type for thumbnail generation');
}