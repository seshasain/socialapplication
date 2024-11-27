import fs from 'fs';
import path from 'path';
import B2 from 'backblaze-b2';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Initialize B2 client
const b2 = new B2({
  applicationKeyId: process.env.VITE_B2_APPLICATION_KEY_ID,
  applicationKey: process.env.VITE_B2_APPLICATION_KEY
});

// Authorize B2 client
let authorized = false;
async function ensureAuthorized() {
  if (!authorized) {
    await b2.authorize();
    authorized = true;
  }
}

/**
 * Upload file to Backblaze B2
 */
export const uploadToB2 = async (fileBuffer, contentType, filename) => {
  try {
    if (!fileBuffer || !contentType || !filename) {
      throw new Error('Missing required parameters for B2 upload');
    }

    await ensureAuthorized();

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
      onUploadProgress: (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          console.log(`Upload progress: ${percentComplete}%`);
        }
      }
    });

    return `${process.env.VITE_B2_PUBLIC_URL}/file/${process.env.VITE_B2_BUCKET_NAME}/${response.fileName}`;
  } catch (error) {
    console.error('B2 upload error:', error);
    throw new Error(`Failed to upload file to B2: ${error.message}`);
  }
};

/**
 * Delete file from Backblaze B2
 */
export const deleteFromB2 = async (fileName) => {
  try {
    if (!fileName) {
      throw new Error('No filename provided for B2 deletion');
    }

    await ensureAuthorized();

    // List file versions to get fileId
    const response = await b2.listFileNames({
      bucketId: process.env.VITE_B2_BUCKET_ID,
      startFileName: fileName,
      maxFileCount: 1
    });

    if (response.data.files.length > 0) {
      const file = response.data.files[0];
      await b2.deleteFileVersion({
        fileId: file.fileId,
        fileName: file.fileName
      });
    }
  } catch (error) {
    console.error('B2 delete error:', error);
    throw new Error(`Failed to delete file from B2: ${error.message}`);
  }
};

/**
 * Save file to B2 and return file info
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

    return {
      id: uniqueId,
      url: b2Url,
      filename,
      mimetype: file.mimetype,
      size: file.size,
      b2Key: `uploads/${filename}`
    };
  } catch (error) {
    console.error('File save error:', error);
    throw new Error(`Failed to save file: ${error.message}`);
  }
}
/**
 * Delete file from B2 and local storage
 */
export async function deleteFile(filename, b2Key) {
  try {
    // Delete from B2 if key exists
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