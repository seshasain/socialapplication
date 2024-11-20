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
export async function saveFile(file) {
  try {
    const uniqueId = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const filename = `${uniqueId}${fileExtension}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Write file to disk
    await fs.promises.writeFile(filepath, file.buffer);

    return {
      id: uniqueId,
      url: `/uploads/${filename}`,
      filename,
      filepath,
      mimetype: file.mimetype,
      size: file.size
    };
  } catch (error) {
    console.error('Local file save error:', error);
    throw new Error('Failed to save file locally');
  }
}

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