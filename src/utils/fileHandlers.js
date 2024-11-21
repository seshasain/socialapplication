import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
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
const b2Client = new S3Client({
  region: process.env.VITE_B2_REGION,
  endpoint: process.env.VITE_B2_ENDPOINT_URL,
  credentials: {
    accessKeyId: process.env.VITE_B2_APPLICATION_KEY_ID,
    secretAccessKey: process.env.VITE_B2_APPLICATION_KEY,
  }
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

    const key = `uploads/${filename}`;
    
    const uploadParams = {
      Bucket: B2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    };

    const command = new PutObjectCommand(uploadParams);
    await b2Client.send(command);

    return `${B2_PUBLIC_URL}/${B2_BUCKET_NAME}/${key}`;
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

    const deleteParams = {
      Bucket: B2_BUCKET_NAME,
      Key: key,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await b2Client.send(command);
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