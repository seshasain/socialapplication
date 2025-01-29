import express from 'express';
import { integrationService } from '../services/integrations';
import { authenticateToken } from '../middleware/auth';
import { validateSourceConfig } from '../middleware/validation';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types/auth';
import { Response } from 'express';

const prisma = new PrismaClient();
const router = express.Router();

// Get all connected sources for a user
router.get('/sources', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sources = await prisma.contentSource.findMany({
      where: { userId: req.user.id },
      include: {
        syncStatus: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    res.json({ sources });
  } catch (error) {
    console.error('Failed to fetch content sources:', error);
    res.status(500).json({ error: 'Failed to fetch content sources' });
  }
});

// Connect Google Docs
router.post('/connect/google-docs', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await integrationService.connectGoogleDocs(
      req.user.id,
      req.body.credentials
    );
    res.json(result);
  } catch (error) {
    console.error('Failed to connect Google Docs:', error);
    res.status(500).json({ error: 'Failed to connect Google Docs' });
  }
});

// Connect WordPress
router.post('/connect/wordpress', authenticateToken, validateSourceConfig, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await integrationService.connectWordPress(
      req.user.id,
      req.body.config
    );
    res.json(result);
  } catch (error) {
    console.error('Failed to connect WordPress:', error);
    res.status(500).json({ error: 'Failed to connect WordPress' });
  }
});

// Sync content from a source
router.post('/sync/:sourceId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await integrationService.syncContent(req.params.sourceId);
    res.json(result);
  } catch (error) {
    console.error('Failed to sync content:', error);
    res.status(500).json({ error: 'Failed to sync content' });
  }
});

// Get posts from a source
router.get('/posts/:sourceId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const posts = await prisma.contentPost.findMany({
      where: {
        sourceId: req.params.sourceId,
        userId: req.user.id
      },
      include: {
        source: true
      }
    });
    res.json({ posts });
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Update post settings
router.patch('/posts/:postId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const post = await prisma.contentPost.update({
      where: { 
        id: req.params.postId,
        userId: req.user.id // Ensure user owns the post
      },
      data: {
        platforms: req.body.platforms,
        status: req.body.status,
        scheduledTime: req.body.scheduledTime,
        metadata: req.body.metadata
      }
    });
    res.json({ post });
  } catch (error) {
    console.error('Failed to update post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Disconnect a source
router.delete('/sources/:sourceId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.contentSource.delete({
      where: { 
        id: req.params.sourceId,
        userId: req.user.id // Ensure user owns the source
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to disconnect source:', error);
    res.status(500).json({ error: 'Failed to disconnect source' });
  }
});

// Get source status
router.get('/sources/:sourceId/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = await prisma.syncStatus.findFirst({
      where: { 
        sourceId: req.params.sourceId,
        source: {
          userId: req.user.id // Ensure user owns the source
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        source: true
      }
    });
    res.json({ status });
  } catch (error) {
    console.error('Failed to fetch source status:', error);
    res.status(500).json({ error: 'Failed to fetch source status' });
  }
});

export default router; 