import express, { Response, Request } from 'express';
import { integrationService } from '../services/integrations';
import { authenticateUser } from '../middleware/auth';
import { validateSourceConfig } from '../middleware/validation';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types/auth';
import asyncHandler from 'express-async-handler';
import prisma from '../lib/prisma';

const router = express.Router();

// Get all connected sources for a user
router.get('/sources', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const sources = await prisma.contentSource.findMany({
    where: {
      userId: user.id
    },
    include: {
      syncStatus: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      }
    }
  });

  res.json({ sources });
}));

// Connect Google Docs
router.post('/connect/google-docs', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const result = await integrationService.connectGoogleDocs(
    user.id,
    req.body.credentials
  );
  res.json(result);
}));

// Connect WordPress
router.post('/connect/wordpress', authenticateUser, validateSourceConfig, asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const result = await integrationService.connectWordPress(
    user.id,
    req.body.config
  );
  res.json(result);
}));

// Sync content from a source
router.post('/sync/:sourceId', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const result = await integrationService.syncContent(req.params.sourceId);
  res.json(result);
}));

// Get posts from a source
router.get('/posts/:sourceId', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const posts = await prisma.contentPost.findMany({
    where: {
      sourceId: req.params.sourceId,
      userId: user.id
    },
    include: {
      source: true
    }
  });
  res.json({ posts });
}));

// Update post settings
router.patch('/posts/:postId', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const post = await prisma.contentPost.update({
    where: { 
      id: req.params.postId,
      userId: user.id
    },
    data: {
      platforms: req.body.platforms,
      status: req.body.status,
      scheduledTime: req.body.scheduledTime,
      metadata: req.body.metadata
    }
  });
  res.json({ post });
}));

// Disconnect a source
router.delete('/sources/:sourceId', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  await prisma.contentSource.delete({
    where: { 
      id: req.params.sourceId,
      userId: user.id
    }
  });
  res.json({ success: true });
}));

// Get source status
router.get('/sources/:sourceId/status', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const status = await prisma.syncStatus.findFirst({
    where: { 
      sourceId: req.params.sourceId,
      source: {
        userId: user.id
      }
    },
    orderBy: { createdAt: 'desc' },
    include: {
      source: true
    }
  });
  res.json({ status });
}));

// Get integration stats
router.get('/stats', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  
  const stats = await prisma.contentSource.groupBy({
    by: ['type'],
    where: {
      userId: user.id
    },
    _count: {
      _all: true
    }
  });

  const syncStats = await prisma.syncStatus.groupBy({
    by: ['status'],
    where: {
      source: {
        userId: user.id
      }
    },
    _count: {
      _all: true
    }
  });

  res.json({
    sources: stats,
    syncs: syncStats
  });
}));

export default router; 