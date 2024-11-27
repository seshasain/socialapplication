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
  b2Key: string;
}

class UploadService {
  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    return new Promise((resolve, reject) => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token');
        }

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress?.(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (!response.url || !response.id) {
                throw new Error('Invalid upload response format');
              }
              resolve(response);
            } catch (error) {
              reject(new Error('Failed to parse upload response'));
            }
          } else {
            let errorMessage = 'Upload failed';
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              errorMessage = errorResponse.error || errorMessage;
            } catch (e) {
              // If response isn't JSON, use status text
              errorMessage = xhr.statusText || errorMessage;
            }
            reject(new Error(errorMessage));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload was aborted'));
        });

        xhr.open('POST', `${APP_URL}/api/media/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      } catch (error) {
        reject(error);
      }
    });
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
          (progress) => {
            onProgress?.(file.name, progress);
            // Only mark as complete if we actually get a successful response
            if (progress === 100) {
              setTimeout(() => {
                onComplete?.(file.name);
              }, 500); // Small delay to ensure final progress is shown
            }
          }
        );
        return result;
      } catch (error) {
        onError?.(file.name, error as Error);
        throw error;
      }
    });

    return Promise.all(uploads);
  }
}

export const uploadService = new UploadService();