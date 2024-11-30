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
    const response = await fetch(`${APP_URL}/api/media/batch-delete`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileIds })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Failed to delete files: ${response.statusText}`);
    }

    // Success response doesn't need to throw an error
    return;
  } catch (error) {
    console.error('File deletion error:', error);
    throw error instanceof Error ? error : new Error('Failed to delete files');
  }
}

/**
 * Delete a single file by its ID
 */
export async function deleteFile(fileId: string): Promise<void> {
  if (!fileId) {
    throw new Error('No file ID provided');
  }

  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token');

  try {
    const response = await fetch(`${APP_URL}/api/media/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Failed to delete file: ${response.statusText}`);
    }

    // Success response doesn't need to throw an error
    return;
  } catch (error) {
    console.error('File deletion error:', error);
    throw error instanceof Error ? error : new Error('Failed to delete file');
  }
}