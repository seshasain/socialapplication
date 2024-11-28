import { v4 as uuidv4 } from 'uuid';
import type { 
  UploadProgress, 
  UploadResponse, 
  UploadCallbacks,
  MediaFile 
} from '../types/media';
import { APP_URL } from '../config/api';
import { validateFile } from '../utils/fileValidation';

class UploadService {
  private pendingUploads = new Map<string, XMLHttpRequest>();

  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> {
    const fileId = uuidv4();
    console.log(`Starting upload for file: ${file.name}, ID: ${fileId}`);

    try {
      validateFile(file);

      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${APP_URL}/api/media/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          console.log(`Upload progress: ${progress}%`);
          onProgress?.(progress);
        }
      };

      const uploadPromise = new Promise<UploadResponse>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201) {
            try {
              const response = JSON.parse(xhr.responseText);
              console.log('Upload successful:', response);
              resolve(response);
            } catch (error) {
              console.error('Failed to parse response:', error);
              reject(new Error('Invalid response format'));
            }
          } else {
            console.error('Upload failed:', xhr.responseText);
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => {
          console.error('Network error during upload');
          reject(new Error('Network error during upload'));
        };

        xhr.ontimeout = () => {
          console.error('Upload timed out');
          reject(new Error('Upload timed out'));
        };
      });

      this.pendingUploads.set(fileId, xhr);
      xhr.send(formData);
      return await uploadPromise;

    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    } finally {
      this.pendingUploads.delete(fileId);
    }
  }

  async uploadMultipleFiles(files: File[], callbacks?: UploadCallbacks): Promise<MediaFile[]> {
    console.log(`Starting upload for ${files.length} files`);
    
    const uploads = files.map(async (file) => {
      try {
        console.log(`Processing file: ${file.name}`);
        const result = await this.uploadFile(
          file,
          (progress) => {
            callbacks?.onProgress?.(file.name, progress);
            if (progress === 100) {
              setTimeout(() => {
                console.log(`Upload completed for ${file.name}`);
                callbacks?.onComplete?.(file.name);
              }, 500);
            }
          }
        );
        return result;
      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error);
        callbacks?.onError?.(file.name, error as Error);
        throw error;
      }
    });

    return Promise.all(uploads);
  }

  async cleanupPendingUploads(): Promise<void> {
    console.log('Cleaning up pending uploads');
    this.pendingUploads.forEach((xhr, fileId) => {
      xhr.abort();
      this.pendingUploads.delete(fileId);
    });
    console.log('Cleanup completed');
  }
}

export const uploadService = new UploadService();