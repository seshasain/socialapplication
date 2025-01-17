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
      maxFileCount: 1
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

export async function cleanupPublishedAndFailedMedia() {
  try {
    // Get all PostPlatform entries that are either published or failed
    const postPlatforms = await prisma.postPlatform.findMany({
      where: {
        OR: [
          { status: 'published' },
          { status: 'failed' }
        ]
      },
      include: {
        post: {
          include: {
            mediaFiles: true
          }
        }
      }
    });

    // Track processed media files to avoid duplicate deletions
    const processedMediaIds = new Set<string>();
    
    for (const platform of postPlatforms) {
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

          // Delete from MediaFile table
          await prisma.mediaFile.delete({
            where: {
              id: mediaFile.id
            }
          });

          // Mark as processed
          processedMediaIds.add(mediaFile.id);
          
          console.log(`Successfully cleaned up media file: ${mediaFile.id}`);
        } catch (error) {
          console.error(`Failed to cleanup media file ${mediaFile.id}:`, error);
          // Continue with other files even if one fails
        }
      }

      // Update the post to remove references to deleted media files
      await prisma.post.update({
        where: {
          id: platform.post.id
        },
        data: {
          mediaFiles: {
            disconnect: mediaFiles.map(file => ({ id: file.id }))
          }
        }
      });
    }

    console.log(`Media cleanup completed. Processed ${processedMediaIds.size} files`);
  } catch (error) {
    console.error('Media cleanup error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
