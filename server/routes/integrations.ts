import express, { Response, Request } from 'express';
import { integrationService } from '../services/integrations';
import { authenticateUser } from '../middleware/auth';
import { validateSourceConfig } from '../middleware/validation';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types/auth';
import asyncHandler from 'express-async-handler';

const prisma = new PrismaClient();
const router = express.Router();

// Get all connected sources for a user
router.get('/sources', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const sources = await prisma.contentSource.findMany({
    where: { userId: user.id },
    include: {
      syncStatus: {
        orderBy: { createdAt: 'desc' },
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
  const [totalPosts, socialAccounts] = await Promise.all([
    prisma.contentPost.count({
      where: { userId: user.id }
    }),
    prisma.socialAccount.findMany({
      where: { userId: user.id }
    })
  ]);

  const totalFollowers = socialAccounts.reduce((sum, account) => sum + (account.followerCount || 0), 0);
  const scheduledPosts = await prisma.post.count({
    where: { 
      userId: user.id,
      scheduledDate: {
        gt: new Date()
      }
    }
  });

  res.json({
    totalPosts,
    engagementRate: totalPosts > 0 ? 0 : 0, // Calculate this based on actual engagement metrics
    totalFollowers,
    scheduledPosts
  });
}));

export default router; 