import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { authenticateUser } from '../middleware/auth';
import asyncHandler from 'express-async-handler';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Get all media files for a user
router.get('/', authenticateUser, asyncHandler(async (req, res) => {
  const { user } = req;
  const mediaFiles = await prisma.mediaFile.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });
  res.json(mediaFiles);
}));

// Upload a new media file
router.post('/upload', authenticateUser, upload.single('file'), asyncHandler(async (req, res) => {
  const { user } = req;
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: 'No file provided' });
    return;
  }

  const mediaFile = await prisma.mediaFile.create({
    data: {
      userId: user.id,
      filename: file.originalname,
      type: file.mimetype,
      size: file.size,
      url: '', // This will be updated after actual file upload
      s3Key: '' // This will be updated after actual file upload
    }
  });

  res.json(mediaFile);
}));

// Delete a media file
router.delete('/:id', authenticateUser, asyncHandler(async (req, res) => {
  const { user } = req;
  const { id } = req.params;

  const mediaFile = await prisma.mediaFile.findFirst({
    where: {
      id,
      userId: user.id
    }
  });

  if (!mediaFile) {
    res.status(404).json({ error: 'Media file not found' });
    return;
  }

  await prisma.mediaFile.delete({
    where: { id }
  });

  res.json({ success: true });
}));

export default router; 