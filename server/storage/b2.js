import B2 from 'backblaze-b2';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'VITE_B2_APPLICATION_KEY_ID',
  'VITE_B2_APPLICATION_KEY',
  'VITE_B2_BUCKET_ID',
  'VITE_B2_BUCKET_NAME'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required B2 environment variables:', missingEnvVars);
}

const b2 = new B2({
  applicationKeyId: process.env.VITE_B2_APPLICATION_KEY_ID,
  applicationKey: process.env.VITE_B2_APPLICATION_KEY,
  retry: {
    retries: 3
  }
});

let authorized = false;

export async function ensureAuthorized() {
  try {
    if (!authorized) {
      if (!process.env.VITE_B2_APPLICATION_KEY_ID || !process.env.VITE_B2_APPLICATION_KEY) {
        throw new Error('B2 credentials not properly configured. Please check your environment variables.');
      }
      await b2.authorize();
      authorized = true;
    }
  } catch (error) {
    console.error('B2 authorization error:', error);
    throw error;
  }
}

export async function uploadToB2(buffer, fileName, contentType) {
  try {
    await ensureAuthorized();

    // Generate a unique filename with UUID
    const fileExt = path.extname(fileName);
    const uniqueFilename = `${uuidv4()}${fileExt}`;

    const { data: { uploadUrl, authorizationToken } } = await b2.getUploadUrl({
      bucketId: process.env.VITE_B2_BUCKET_ID
    });

    const response = await b2.uploadFile({
      uploadUrl,
      uploadAuthToken: authorizationToken,
      fileName: uniqueFilename, // Use the unique filename
      data: buffer,
      contentType
    });

    return response.data;
  } catch (error) {
    console.error('B2 upload error:', error);
    throw error;
  }
}

export async function getFileFromB2(fileName) {
  try {
    await ensureAuthorized();

    if (!process.env.VITE_B2_BUCKET_NAME) {
      throw new Error('VITE_B2_BUCKET_NAME environment variable is not set');
    }

    const response = await b2.downloadFileByName({
      bucketName: process.env.VITE_B2_BUCKET_NAME,
      fileName: fileName,
      responseType: 'arraybuffer'
    });

    return Buffer.from(response.data);
  } catch (error) {
    console.error('B2 download error:', error);
    throw error;
  }
}

export async function verifyB2Credentials() {
  try {
    await b2.authorize();
    const response = await b2.listBuckets();
    const bucket = response.data.buckets.find(
      b => b.bucketId === process.env.VITE_B2_BUCKET_ID
    );
    
    if (!bucket) {
      throw new Error('Bucket not found');
    }
    
    return true;
  } catch (error) {
    console.error('B2 credentials verification failed:', error);
    throw error;
  }
}

export { b2 };