import { APP_URL } from '../config/api';
import type { DeleteFilesResponse } from '../types/media';

/**
 * Delete multiple files by their IDs
 */
export async function deleteFiles(fileIds: string[]): Promise<void> {
  if (!fileIds.length) return;

  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token');

  try {
    // Using the correct endpoint that matches the server implementation
    const response = await fetch(`${APP_URL}/api/media/delete`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids: fileIds }) // Match the expected request body format
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete files' }));
      throw new Error(errorData.message || `Failed to delete files: ${response.statusText}`);
    }

    const data: DeleteFilesResponse = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete files');
    }
  } catch (error) {
    console.error('File deletion error:', error);
    throw error instanceof Error ? error : new Error('Failed to delete files');
  }
}

/**
 * Delete a single file by its ID
 */
export async function deleteFile(fileId: string): Promise<void> {
  if (!fileId) return;

  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token');

  try {
    // Using the correct endpoint that matches the server implementation
    const response = await fetch(`${APP_URL}/api/media/delete/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete file' }));
      throw new Error(errorData.message || `Failed to delete file: ${response.statusText}`);
    }

    const data: DeleteFilesResponse = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete file');
    }
  } catch (error) {
    console.error('File deletion error:', error);
    throw error instanceof Error ? error : new Error('Failed to delete file');
  }
}