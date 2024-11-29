import { APP_URL } from '../config/api';

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
      body: JSON.stringify({ ids: fileIds })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete files' }));
      throw new Error(errorData.message || 'Failed to delete files');
    }
  } catch (error) {
    console.error('File deletion error:', error);
    throw error;
  }
}

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
      throw new Error(errorData.message || 'Failed to delete file');
    }
  } catch (error) {
    console.error('File deletion error:', error);
    throw error;
  }
}