// src/service/fileCleanupService.ts

import { APP_URL } from '../config/api';

export async function deleteFile(fileId: string): Promise<void> {
  if (!fileId) {
    console.log('No fileId provided, skipping deletion');
    return;
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

    // Don't throw error for 404 - file is already gone
    if (!response.ok && response.status !== 404) {
      const data = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(data.message || `Failed to delete file: ${response.statusText}`);
    }

    console.log(`File ${fileId} deleted or already removed`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      console.log(`File ${fileId} already removed`);
      return;
    }
    console.error('File deletion error:', error);
    throw error;
  }
}

export async function deleteFiles(fileIds: string[]): Promise<void> {
  if (!fileIds.length) return;

  await Promise.all(fileIds.map(fileId => deleteFile(fileId)));
}
