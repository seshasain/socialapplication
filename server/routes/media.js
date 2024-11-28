import express from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import B2 from 'backblaze-b2';
import sharp from 'sharp';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize B2 client
const b2 = new B2({
  applicationKeyId: process.env.VITE_B2_APPLICATION_KEY_ID,
  applicationKey: process.env.VITE_B2_APPLICATION_KEY
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Helper function to authorize B2
async function authorizeB2() {
  console.log('Authorizing B2 client');
  try {
    await b2.authorize();
    console.log('B2 authorization successful');
  } catch (error) {
    console.error('B2 authorization failed:', error);
    throw new Error('Failed to authorize with B2');
  }
}

// Helper function to get upload URL
async function getUploadUrl() {
  console.log('Getting B2 upload URL');
  try {
    const response = await b2.getUploadUrl({
      bucketId: process.env.VITE_B2_BUCKET_ID
    });
    console.log('Successfully obtained upload URL');
    return response.data;
  } catch (error) {
    console.error('Failed to get upload URL:', error);
    throw new Error('Failed to get upload URL');
  }
}

// Upload endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
  console.log('Processing file upload request');
  
  if (!req.file) {
    console.error('No file provided');
    return res.status(400).json({ error: 'No file provided' });
  }

  try {
    const file = req.file;
    const fileId = uuidv4();
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `uploads/${fileId}.${fileExtension}`;

    console.log(`Processing file: ${fileName}`);

    // Authorize B2
    await authorizeB2();

    // Get upload URL
    const { uploadUrl, authorizationToken } = await getUploadUrl();

    // Upload file to B2
    console.log('Uploading file to B2');
    const uploadResponse = await b2.uploadFile({
      uploadUrl,
      uploadAuthToken: authorizationToken,
      fileName,
      data: file.buffer,
      contentType: file.mimetype,
      onUploadProgress: (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          console.log(`Upload progress: ${progress}%`);
        }
      }
    });

    const fileUrl = `${process.env.VITE_B2_PUBLIC_URL}/file/${process.env.VITE_B2_BUCKET_NAME}/${fileName}`;
    console.log('File uploaded successfully:', fileUrl);

    // Save file record to database
    const mediaFile = await prisma.mediaFile.create({
      data: {
        id: fileId,
        userId: req.user.id, // Assuming you have user info in request
        url: fileUrl,
        type: file.mimetype,
        filename: file.originalname,
        size: file.size,
        s3Key: fileName
      }
    });

    console.log('File record created in database');
    res.json(mediaFile);

  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Delete endpoint
router.delete('/:fileId', async (req, res) => {
  console.log(`Processing delete request for file: ${req.params.fileId}`);

  try {
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id: req.params.fileId }
    });

    if (!mediaFile) {
      console.log('File not found');
      return res.status(404).json({ error: 'File not found' });
    }

    // Authorize B2
    await authorizeB2();

    // Delete file from B2
    console.log('Deleting file from B2');
    await b2.deleteFileVersion({
      fileId: mediaFile.s3Key,
      fileName: mediaFile.filename
    });

    // Delete record from database
    await prisma.mediaFile.delete({
      where: { id: req.params.fileId }
    });

    console.log('File deleted successfully');
    res.json({ success: true });

  } catch (error) {
    console.error('Delete failed:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;