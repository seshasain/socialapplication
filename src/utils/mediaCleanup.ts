import { deleteFromB2 } from './fileHandlers';
import { APP_URL } from '../config/api';

interface MediaFile {
  id: string;
  s3Key: string;
}

interface PostPlatform { 
  id: string;
  status: string;
  post: {
    mediaFiles: MediaFile[];
  };
}

export async function cleanupPublishedAndFailedMedia() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No auth token found for media cleanup');
      return;
    }

    // Fetch posts with published or failed status and their media files
    const response = await fetch(`${APP_URL}/api/posts/cleanup-check`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch posts for cleanup');
    }

    const platforms: PostPlatform[] = await response.json();
    
    // Track processed media files to avoid duplicate deletions
    const processedMediaIds = new Set<string>();
    
    for (const platform of platforms) {
      // Only process published or failed posts
      if (!['published', 'failed'].includes(platform.status)) {
        continue;
      }

      // Get media files for this post
      const mediaFiles = platform.post.mediaFiles;
      
      for (const mediaFile of mediaFiles) {
        // Skip if already processed
        if (processedMediaIds.has(mediaFile.id)) {
          continue;
        }

        try {
          // Delete from B2
          await deleteFromB2(mediaFile.s3Key);

          // Delete from database
          await fetch(`${APP_URL}/api/media/${mediaFile.id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          // Mark as processed
          processedMediaIds.add(mediaFile.id);
          
          console.log(`Successfully cleaned up media file: ${mediaFile.id}`);
        } catch (error) {
          console.error(`Failed to cleanup media file ${mediaFile.id}:`, error);
        }
      }
    }

    console.log(`Media cleanup completed. Processed ${processedMediaIds.size} files`);
  } catch (error) {
    console.error('Media cleanup error:', error);
  }
}