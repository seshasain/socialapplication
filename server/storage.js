import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const getFileInfo = async (filename) => {
  try {
    const filepath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filepath)) {
      throw new Error('File not found');
    }

    const stats = await fs.promises.stat(filepath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      filepath
    };
  } catch (error) {
    console.error('File info error:', error);
    throw new Error('Failed to get file info');
  }
};
export const saveFile = async (file) => {
  try {
    const uniqueId = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const filename = `${uniqueId}${fileExtension}`;
    const filepath = path.join(uploadsDir, filename);
    
    if (file.mimetype.startsWith('image/')) {
      // Process image with sharp
      await sharp(file.buffer)
        .resize(2000, 2000, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toFile(filepath);
    } else if (file.mimetype.startsWith('video/')) {
      // Save video file directly
      await fs.promises.writeFile(filepath, file.buffer);
    } else {
      throw new Error('Unsupported file type');
    }
    
    return {
      id: uniqueId,
      url: `/uploads/${filename}`, // Return relative URL
      filename,
      size: file.size,
      type: file.mimetype,
      originalName: file.originalname
    };
  } catch (error) {
    console.error('File save error:', error);
    throw new Error('Failed to save file');
  }
};

export const deleteFile = async (filename) => {
  try {
    const filepath = path.join(uploadsDir, filename);
    if (fs.existsSync(filepath)) {
      await fs.promises.unlink(filepath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('File deletion error:', error);
    throw new Error('Failed to delete file');
  }
};