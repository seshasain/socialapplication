import { v4 as uuidv4 } from 'uuid';
import { APP_URL } from '../config/api';

export interface UploadProgress {
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface UploadResponse {
  id: string;
  url: string;
  filename: string;
  type: string;
  size: number;
  s3Key: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

class UploadService {
  private async getPresignedUrl(file: File): Promise<PresignedUrlResponse> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token');

    const extension = file.name.split('.').pop();
    const filename = `${uuidv4()}.${extension}`;

    const response = await fetch(`${APP_URL}/api/media/presigned-url`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename,
        contentType: file.type
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get presigned URL');
    }

    return response.json();
  }

  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    try {
      // Get presigned URL
      const { uploadUrl, fileUrl, key } = await this.getPresignedUrl(file);

      // Upload to B2 directly
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      // Register upload with our backend
      const token = localStorage.getItem('token');
      const registerResponse = await fetch(`${APP_URL}/api/media/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: file.name,
          type: file.type,
          size: file.size,
          url: fileUrl,
          s3Key: key
        })
      });

      if (!registerResponse.ok) {
        throw new Error('Failed to register upload');
      }

      return registerResponse.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async uploadMultipleFiles(
    files: File[],
    onProgress?: (fileId: string, progress: number) => void,
    onComplete?: (fileId: string) => void,
    onError?: (fileId: string, error: Error) => void
  ): Promise<UploadResponse[]> {
    const uploads = files.map(async (file) => {
      try {
        const result = await this.uploadFile(file, 
          (progress) => onProgress?.(file.name, progress)
        );
        onComplete?.(file.name);
        return result;
      } catch (error) {
        onError?.(file.name, error as Error);
        throw error;
      }
    });

    return Promise.all(uploads);
  }

  async deleteFile(fileId: string): Promise<void> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token');

    const response = await fetch(`${APP_URL}/api/media/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  }
}

export const uploadService = new UploadService();