import { Router } from 'express';
import { OAuthService } from '../services/oauth.service';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Initialize OAuth flows
router.get('/auth/:provider/init', authenticateUser, async (req, res) => {
  const { provider } = req.params;
  const userId = req.user.id;

  try {
    let authUrl;
    switch (provider) {
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
        return res.status(400).json({ error: 'Invalid provider' });
    }
    res.json({ authUrl });
  } catch (error) {
    console.error('OAuth initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize OAuth flow' });
  }
});

// OAuth callbacks
router.get('/auth/google/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const integration = await OAuthService.handleGoogleCallback(code.toString(), state.toString());
    res.redirect(`/integrations?success=true&provider=google&id=${integration.id}`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect('/integrations?error=google_auth_failed');
  }
});

router.get('/auth/notion/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const integration = await OAuthService.handleNotionCallback(code.toString(), state.toString());
    res.redirect(`/integrations?success=true&provider=notion&id=${integration.id}`);
  } catch (error) {
    console.error('Notion OAuth callback error:', error);
    res.redirect('/integrations?error=notion_auth_failed');
  }
});

router.get('/auth/wordpress/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const integration = await OAuthService.handleWordPressCallback(code.toString(), state.toString());
    res.redirect(`/integrations?success=true&provider=wordpress&id=${integration.id}`);
  } catch (error) {
    console.error('WordPress OAuth callback error:', error);
    res.redirect('/integrations?error=wordpress_auth_failed');
  }
});

// Manage integrations
router.get('/integrations', authenticateUser, async (req, res) => {
  try {
    const integrations = await prisma.integration.findMany({
      where: { userId: req.user.id }
    });
    res.json(integrations);
  } catch (error) {
    console.error('Failed to fetch integrations:', error);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

router.delete('/integrations/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;

  try {
    await OAuthService.revokeAccess(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to revoke integration:', error);
    res.status(500).json({ error: 'Failed to revoke integration' });
  }
});

export default router; 