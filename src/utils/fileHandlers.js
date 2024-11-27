import fs from 'fs';
import path from 'path';
import { B2 } from '@backblazeb2/b2-sdk-js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Initialize B2 client with environment variables
const b2 = new B2({
  applicationKeyId: process.env.VITE_B2_APPLICATION_KEY_ID,
  applicationKey: process.env.VITE_B2_APPLICATION_KEY
});

const B2_BUCKET_NAME = process.env.VITE_B2_BUCKET_NAME;
const B2_PUBLIC_URL = process.env.VITE_B2_PUBLIC_URL;

/**
 * Upload file to Backblaze B2
 */
export const uploadToB2 = async (fileBuffer, contentType, filename) => {
  try {
    if (!fileBuffer || !contentType || !filename) {
      throw new Error('Missing required parameters for B2 upload');
    }

    // Authorize with B2
    await b2.authorize();

    // Get upload URL
    const { uploadUrl, authorizationToken } = await b2.getUploadUrl({
      bucketId: process.env.VITE_B2_BUCKET_ID
    });

    // Upload file
    const response = await b2.uploadFile({
      uploadUrl: uploadUrl,
      uploadAuthToken: authorizationToken,
      fileName: `uploads/${filename}`,
      data: fileBuffer,
      contentType: contentType,
    });

    return `${B2_PUBLIC_URL}/${B2_BUCKET_NAME}/${response.fileName}`;
  } catch (error) {
    console.error('B2 upload error:', error);
    throw new Error(`Failed to upload file to B2: ${error.message}`);
  }
};

/**
 * Delete file from Backblaze B2
 */
export const deleteFromB2 = async (key) => {
  try {
    if (!key) {
      throw new Error('No key provided for B2 deletion');
    }

    // Authorize with B2
    await b2.authorize();

    // Get file info to get fileId
    const { files } = await b2.listFileNames({
      bucketId: process.env.VITE_B2_BUCKET_ID,
      prefix: key,
      maxFileCount: 1
    });

    if (files.length > 0) {
      await b2.deleteFileVersion({
        fileId: files[0].fileId,
        fileName: files[0].fileName
      });
    }
  } catch (error) {
    console.error('B2 delete error:', error);
    throw new Error(`Failed to delete file from B2: ${error.message}`);
  }
};

/**
 * Save file to B2
 */
export async function saveFile(file) {
  try {
    if (!file || !file.buffer || !file.originalname || !file.mimetype) {
      throw new Error('Invalid file object provided');
    }

    const uniqueId = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const filename = `${uniqueId}${fileExtension}`;

    // Upload to B2
    const b2Url = await uploadToB2(file.buffer, file.mimetype, filename);
    const b2Key = `uploads/${filename}`;

    return {
      id: uniqueId,
      url: b2Url,
      filename,
      mimetype: file.mimetype,
      size: file.size,
      b2Key
    };
  } catch (error) {
    console.error('File save error:', error);
    throw new Error(`Failed to save file: ${error.message}`);
  }
}

/**
 * Delete file from B2 and locally if exists
 */
export async function deleteFile(filename, b2Key) {
  try {
    // Delete from B2
    if (b2Key) {
      await deleteFromB2(b2Key);
    }
    
    // Delete local file if exists
    const filepath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filepath)) {
      await fs.promises.unlink(filepath);
    }
  } catch (error) {
    console.error('File deletion error:', error);
    throw error;
  }
}