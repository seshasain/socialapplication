import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import B2 from 'backblaze-b2';

interface FileUploadResponse {
  id: string;
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  b2Key: string;
}

interface UploadProgressEvent {
  lengthComputable: boolean;
  loaded: number;
  total: number;
}

interface FileObject {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Initialize B2 client
const b2 = new B2({
  applicationKeyId: process.env.VITE_B2_APPLICATION_KEY_ID as string,
  applicationKey: process.env.VITE_B2_APPLICATION_KEY as string,
  retry: {
    retries: 3
  }
});

let authorized = false;
let uploadUrl: string | null = null;
let uploadAuthToken: string | null = null;

async function ensureAuthorized(): Promise<void> {
  if (!authorized) {
    await b2.authorize();
    authorized = true;
  }
}

async function getUploadUrl(): Promise<{ uploadUrl: string; uploadAuthToken: string }> {
  if (!uploadUrl || !uploadAuthToken) {
    const response = await b2.getUploadUrl({
      bucketId: process.env.VITE_B2_BUCKET_ID as string
    });
    uploadUrl = response.data.uploadUrl;
    uploadAuthToken = response.data.authorizationToken;
  }
  return { uploadUrl, uploadAuthToken } as { uploadUrl: string; uploadAuthToken: string };
}

async function getDownloadUrl(fileName: string): Promise<string> {
  await ensureAuthorized();
  
  try {
    const response = await b2.listFileNames({
      bucketId: process.env.VITE_B2_BUCKET_ID as string,
      startFileName: fileName,
      maxFileCount: 1,
      delimiter: '',
      prefix: ''
    });

    if (!response.data.files.length) {
      throw new Error('File not found');
    }

    const file = response.data.files[0];
    
    const downloadUrl = await b2.getDownloadAuthorization({
      bucketId: process.env.VITE_B2_BUCKET_ID as string,
      fileNamePrefix: fileName,
      validDurationInSeconds: 604800, // 7 days
    });

    // Use the downloadUrl from the authorization response
    return `https://f002.backblazeb2.com/file/${process.env.VITE_B2_BUCKET_NAME}/${fileName}?Authorization=${downloadUrl.data.authorizationToken}`;
  } catch (error) {
    console.error('Error generating download URL:', error);
    throw new Error('Failed to generate download URL');
  }
}

export const uploadToB2 = async (
  fileBuffer: Buffer,
  contentType: string,
  filename: string
): Promise<string> => {
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
      mime: contentType,
      onUploadProgress: (event: UploadProgressEvent) => {
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
    throw new Error(`Failed to upload file to B2: ${(error as Error).message}`);
  }
};

export const deleteFromB2 = async (fileName: string): Promise<void> => {
  try {
    if (!fileName) {
      throw new Error('No filename provided for B2 deletion');
    }

    await ensureAuthorized();

    const response = await b2.listFileNames({
      bucketId: process.env.VITE_B2_BUCKET_ID as string,
      startFileName: fileName,
      maxFileCount: 1,
      delimiter: '',
      prefix: ''
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
    throw new Error(`Failed to delete file from B2: ${(error as Error).message}`);
  }
};

export async function saveFile(file: FileObject): Promise<FileUploadResponse> {
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
    throw new Error(`Failed to save file: ${(error as Error).message}`);
  }
}

export async function deleteFile(filename: string, b2Key?: string): Promise<void> {
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