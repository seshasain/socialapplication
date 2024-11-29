export interface MediaFile {
  id: string;
  userId: string;
  url: string;
  filename: string;
  type: string;
  size: number;
  s3Key: string;
  createdAt?: string;
  updatedAt?: string;
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
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface UploadResponse extends MediaFile {
  error?: string;
}

export interface UploadConfig {
  maxFileSize: number;
  acceptedTypes: string[];
  maxFiles: number;
}

export interface UploadCallbacks {
  onProgress?: (fileId: string, progress: number) => void;
  onComplete?: (fileId: string) => void;
  onError?: (fileId: string, error: Error) => void;
}