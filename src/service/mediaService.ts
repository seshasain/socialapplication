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
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${APP_URL}/api/media/presigned-url`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get presigned URL');
      }

      return response.json();
    } catch (error) {
      console.error('Presigned URL error:', error);
      throw error;
    }
  }

  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    try {
      // Get presigned URL
      const { uploadUrl, fileUrl, key } = await this.getPresignedUrl(file);

      // Upload to S3 with progress tracking
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress?.(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);

      await uploadPromise;

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
        const result = await this.uploadFile(
          file,
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
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${APP_URL}/api/media/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }
}
export const uploadService = new UploadService();