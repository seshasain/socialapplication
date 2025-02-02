import { Router, Response, RequestHandler } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth';
import prisma from '../../lib/prisma';

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Start OAuth flow
router.get('/auth/google', authenticateToken, ((req, res) => {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/documents.readonly',
    ],
    prompt: 'consent',
    state: (req as AuthenticatedRequest).user.id,
  });

  res.redirect(authUrl);
}) as RequestHandler);

// OAuth callback
router.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const userId = state as string;

    if (!code || !userId) {
      throw new Error('Missing required parameters');
    }

    // Exchange code for tokens
    const { tokens } = await client.getToken(code as string);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to get tokens');
    }

    // Create integration
    const source = await prisma.contentSource.create({
      data: {
        type: 'google_docs',
        name: 'Google Docs',
        connected: true,
        userId,
        config: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        },
      },
    });

    // Redirect to success page
    res.redirect('/integrations?success=true');
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect('/integrations?error=auth_failed');
  }
});

router.get('/profile', authenticateToken, (async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as AuthenticatedRequest).user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        subscription: {
          include: {
            plan: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler);

export default router; 