import B2 from 'backblaze-b2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize B2 client
const b2 = new B2({
  applicationKeyId: import.meta.env.VITE_B2_APPLICATION_KEY_ID,
  applicationKey: import.meta.env.VITE_B2_APPLICATION_KEY,
  retry: {
    retries: 3
  }
});

let authorized = false;

// Helper function to ensure B2 authorization
async function ensureAuthorized() {
  if (!authorized) {
    if (!import.meta.env.VITE_B2_APPLICATION_KEY_ID || !import.meta.env.VITE_B2_APPLICATION_KEY) {
      throw new Error('B2 credentials not properly configured');
    }
    await b2.authorize();
    authorized = true;
  }
}

// Function to delete file from B2
async function deleteFromB2(fileName: string) {
  try {
    if (!fileName) {
      throw new Error('No filename provided for B2 deletion');
    }

    await ensureAuthorized();

    // First, list the file to get its ID
    const response = await b2.listFileNames({
      bucketId: import.meta.env.VITE_B2_BUCKET_ID,
      startFileName: fileName,
      maxFileCount: 1,
      prefix: '', 
      delimiter: '', 
    });


    if (response.data.files.length > 0) {
      const file = response.data.files[0];
      await b2.deleteFileVersion({
        fileId: file.fileId,
        fileName: file.fileName
      });
      console.log(`Successfully deleted file from B2: ${fileName}`);
    } else {
      console.log(`File not found in B2: ${fileName}`);
    }
  } catch (error) {
    console.error('B2 delete error:', error);
    throw new Error(`Failed to delete file from B2: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

import { APP_URL } from '../config/api';

export async function cleanupPublishedAndFailedMedia() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${APP_URL}/api/media/cleanup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cleanup media');
    }

    console.log('Media cleanup completed successfully');
  } catch (error) {
    console.error('Media cleanup error:', error);
    throw error;
  }
}

