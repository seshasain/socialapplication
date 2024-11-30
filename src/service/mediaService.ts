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
  private uploadProgress = new Map<string, number>();

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

      // Track upload progress with throttling
      let lastUpdate = 0;
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const now = Date.now();
          // Update progress at most every 100ms to prevent excessive re-renders
          if (now - lastUpdate > 100) {
            const progress = Math.round((event.loaded / event.total) * 100);
            this.uploadProgress.set(fileId, progress);
            console.log(`Upload progress for ${file.name}: ${progress}%`);
            onProgress?.(progress);
            lastUpdate = now;
          }
        }
      };

      const uploadPromise = new Promise<UploadResponse>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201) {
            try {
              const response = JSON.parse(xhr.responseText);
              console.log('Upload successful:', response);
              this.uploadProgress.delete(fileId);
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
      this.uploadProgress.delete(fileId);
      throw error;
    } finally {
      this.pendingUploads.delete(fileId);
    }
  }

  async uploadMultipleFiles(files: File[], callbacks?: UploadCallbacks): Promise<MediaFile[]> {
    console.log(`Starting upload for ${files.length} files`);
    
    const uploads = files.map(async (file, index) => {
      try {
        console.log(`Processing file ${index + 1}/${files.length}: ${file.name}`);
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

  getTotalProgress(): number {
    if (this.uploadProgress.size === 0) return 0;
    
    const totalProgress = Array.from(this.uploadProgress.values()).reduce(
      (sum, progress) => sum + progress,
      0
    );
    
    return Math.round(totalProgress / this.uploadProgress.size);
  }

  async cleanupPendingUploads(): Promise<void> {
    console.log('Cleaning up pending uploads');
    this.pendingUploads.forEach((xhr, fileId) => {
      xhr.abort();
      this.pendingUploads.delete(fileId);
      this.uploadProgress.delete(fileId);
    });
    console.log('Cleanup completed');
  }
}

export const uploadService = new UploadService();