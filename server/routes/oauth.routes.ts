import { Request, Response } from 'express';
import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../lib/prisma';
import { OAuthService } from '../services/oauth.service';

const router = Router();

// Type for request with user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

router.get('/init/:platform', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { platform } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  let authUrl: string;
  switch (platform) {
    case 'google':
      authUrl = OAuthService.getGoogleAuthUrl(userId);
      break;
    case 'notion':
      authUrl = OAuthService.getNotionAuthUrl(userId);
      break;
    case 'wordpress':
      authUrl = OAuthService.getWordPressAuthUrl(userId);
      break;
    default:
      throw new Error('Invalid platform');
  }

  res.json({ url: authUrl });
}));

router.get('/callback/google', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { code, state } = req.query;

  if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
    throw new Error('Invalid request parameters');
  }

  const integration = await OAuthService.handleGoogleCallback(code, state);
  res.json({ success: true, integration });
}));

router.get('/callback/notion', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { code, state } = req.query;

  if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
    throw new Error('Invalid request parameters');
  }

  const integration = await OAuthService.handleNotionCallback(code, state);
  res.json({ success: true, integration });
}));

router.get('/callback/wordpress', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { code, state } = req.query;

  if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
    throw new Error('Invalid request parameters');
  }

  const integration = await OAuthService.handleWordPressCallback(code, state);
  res.json({ success: true, integration });
}));

router.get('/integrations', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const integrations = await prisma.integration.findMany({
    where: { userId },
  });

  res.json(integrations);
}));

router.delete('/integration/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const integration = await prisma.integration.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!integration) {
    throw new Error('Integration not found');
  }

  await OAuthService.revokeAccess(id);
  res.json({ success: true });
}));

export default router; 