import { PrismaClient } from '@prisma/client';
import * as fileHandlers from './fileHandlers';

const prisma = new PrismaClient();

export async function cleanupUnusedMediaFiles() {
  try {
    console.log('Starting media files cleanup process...');

    // Find all media files associated with completed or failed posts
    const mediaFilesToCleanup = await prisma.mediaFile.findMany({
      where: {
        posts: {
          some: {
            platforms: {
              some: {
                status: {
                  in: ['published', 'failed']
                }
              }
            }
          }
        }
      },
      include: {
        posts: {
          include: {
            platforms: true
          }
        }
      }
    });

    console.log(`Found ${mediaFilesToCleanup.length} media files to process`);

    for (const mediaFile of mediaFilesToCleanup) {
      try {
        // Check if all associated posts are either published or failed
        const shouldDelete = mediaFile.posts.every(post =>
          post.platforms.every(platform =>
            ['published', 'failed'].includes(platform.status)
          )
        );

        if (shouldDelete) {
          console.log(`Cleaning up media file: ${mediaFile.id}`);
          
          // Delete from B2
          if (mediaFile.s3Key) {
            await deleteFromB2(mediaFile.s3Key);
            console.log(`Deleted file from B2: ${mediaFile.s3Key}`);
          }

          // Delete from database
          await prisma.mediaFile.delete({
            where: {
              id: mediaFile.id
            }
          });

          console.log(`Deleted media file record from database: ${mediaFile.id}`);
        }
      } catch (error) {
        console.error(`Error processing media file ${mediaFile.id}:`, error);
        // Continue with next file even if one fails
        continue;
      }
    }

    console.log('Media files cleanup process completed');
  } catch (error) {
    console.error('Error during media files cleanup:', error);
    throw error;
  }
}