import express, { Response } from 'express';
import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth';
import { AuthenticatedRequest } from '../../types/auth';

const router = express.Router();
const prisma = new PrismaClient();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Start OAuth flow
router.get('/auth/google', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/documents.readonly',
    ],
    prompt: 'consent',
    state: req.user.id, // Pass user ID to callback
  });

  res.redirect(authUrl);
});

// OAuth callback
router.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const userId = state as string;

    if (!code || !userId) {
      throw new Error('Missing required parameters');
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    
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

export default router; 