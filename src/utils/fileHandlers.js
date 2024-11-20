import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload file to S3
 */
export const uploadToS3 = async (file, key) => {
  try {
    const fileStream = fs.createReadStream(file.path);
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileStream,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
};

/**
 * Delete file from S3
 */
export const deleteFromS3 = async (key) => {
  try {
    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Failed to delete file from S3');
  }
};

/**
 * Save file locally
 */
export const saveFile = async (file) => {
  try {
    const filename = `${uuidv4()}-${file.originalname}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const id =  `${uuidv4()}`;
    await fs.promises.writeFile(filepath, file.buffer);
    
    return {
      id,
      filename,
      filepath,
      mimetype: file.mimetype,
      size: file.size,
    };
  } catch (error) {
    console.error('Local file save error:', error);
    throw new Error('Failed to save file locally');
  }
};

/**
 * Delete file locally
 */
export async function deleteFile(filename) {
  if (!filename) return;
  
  try {
    const filepath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filepath)) {
      await fs.promises.unlink(filepath);
    }
  } catch (error) {
    console.error('File deletion error:', error);
  }
}