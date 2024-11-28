import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import B2 from 'backblaze-b2';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Initialize B2 client
const b2 = new B2({
  applicationKeyId: process.env.VITE_B2_APPLICATION_KEY_ID,
  applicationKey: process.env.VITE_B2_APPLICATION_KEY,
  retry: {
    retries: 3
  }
});

let authorized = false;
let uploadUrl = null;
let uploadAuthToken = null;

async function ensureAuthorized() {
  if (!authorized) {
    await b2.authorize();
    authorized = true;
  }
}

async function getUploadUrl() {
  if (!uploadUrl || !uploadAuthToken) {
    const response = await b2.getUploadUrl({
      bucketId: process.env.VITE_B2_BUCKET_ID
    });
    uploadUrl = response.data.uploadUrl;
    uploadAuthToken = response.data.authorizationToken;
  }
  return { uploadUrl, uploadAuthToken };
}

async function getDownloadUrl(fileName) {
  await ensureAuthorized();
  
  try {
    // Get file info first
    const response = await b2.listFileNames({
      bucketId: process.env.VITE_B2_BUCKET_ID,
      startFileName: fileName,
      maxFileCount: 1
    });

    if (!response.data.files.length) {
      throw new Error('File not found');
    }

    const file = response.data.files[0];
    
    // Generate authorized download URL
    const downloadUrl = await b2.getDownloadAuthorization({
      bucketId: process.env.VITE_B2_BUCKET_ID,
      fileNamePrefix: fileName,
      validDurationInSeconds: 604800, // 7 days
    });

    return `${b2.downloadUrl}/file/${process.env.VITE_B2_BUCKET_NAME}/${fileName}?Authorization=${downloadUrl.data.authorizationToken}`;
  } catch (error) {
    console.error('Error generating download URL:', error);
    throw new Error('Failed to generate download URL');
  }
}

export const uploadToB2 = async (fileBuffer, contentType, filename) => {
  try {
    if (!fileBuffer || !contentType || !filename) {
      throw new Error('Missing required parameters for B2 upload');
    }

    await ensureAuthorized();
    const { uploadUrl: url, uploadAuthToken: token } = await getUploadUrl();

    if (!url || !token) {
      throw new Error('Failed to get B2 upload URL');
    }

    const uploadResponse = await b2.uploadFile({
      uploadUrl: url,
      uploadAuthToken: token,
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

    // Reset upload URL after use (B2 best practice)
    uploadUrl = null;
    uploadAuthToken = null;

    if (!uploadResponse || !uploadResponse.data) {
      throw new Error('Invalid upload response from B2');
    }

    // Generate authorized download URL for the uploaded file
    const downloadUrl = await getDownloadUrl(`uploads/${filename}`);
    return downloadUrl;
  } catch (error) {
    console.error('B2 upload error:', error);
    throw new Error(`Failed to upload file to B2: ${error.message}`);
  }
};

export const deleteFromB2 = async (fileName) => {
  try {
    if (!fileName) {
      throw new Error('No filename provided for B2 deletion');
    }

    await ensureAuthorized();

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

export async function saveFile(file) {
  try {
    if (!file || !file.buffer || !file.originalname || !file.mimetype) {
      throw new Error('Invalid file object provided');
    }

    const uniqueId = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const filename = `${uniqueId}${fileExtension}`;

    // Upload to B2 and get authorized download URL
    const fileUrl = await uploadToB2(file.buffer, file.mimetype, filename);

    if (!fileUrl) {
      throw new Error('Failed to get B2 file URL');
    }
    return {
      id: uniqueId,
      url: fileUrl,
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