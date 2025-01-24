export type MediaType = 'image' | 'video';

export interface MediaFile {
  id: string;
  url: string;
  type: MediaType;
  filename: string;
  size: number;
  userId?: string;
  s3Key?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface DeleteFileResponse {
  success: boolean;
  message?: string;
  fileId?: string;
}

export interface DeleteFilesResponse {
  success: boolean;
  message?: string;
  deletedFiles?: string[];
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResponse {
  id: string;
  url: string;
  filename: string;
  type: MediaType;
  size: number;
  s3Key?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadConfig {
  maxFileSize: number;
  acceptedTypes: string[];
  maxFiles: number;
}

export interface UploadCallbacks {
  onProgress?: (filename: string, progress: number) => void;
  onComplete?: (filename: string) => void;
  onError?: (filename: string, error: Error) => void;
}