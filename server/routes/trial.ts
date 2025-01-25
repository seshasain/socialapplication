import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import { TrialService } from '../services/trial.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

const router = Router();
const trialService = new TrialService();

// Type-safe middleware wrapper
const typedHandler = (
  handler: (req: AuthenticatedRequest, res: Response) => Promise<void>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req as AuthenticatedRequest, res);
    } catch (error) {
      next(error);
    }
  };
};

// Get trial status
router.get('/status', authenticateToken as any, typedHandler(async (req, res) => {
  const status = await trialService.getTrialStatus(req.user.id);
  res.json(status);
}));

// Get trial usage
router.get('/usage', authenticateToken as any, typedHandler(async (req, res) => {
  const usage = await trialService.getTrialUsage(req.user.id);
  res.json(usage);
}));

// Request trial extension
router.post('/extend', authenticateToken as any, typedHandler(async (req, res) => {
  const { days, reason } = req.body;

  if (!days || !reason) {
    res.status(400).json({ error: 'Days and reason are required' });
    return;
  }

  const request = await trialService.extendTrial(req.user.id, days, reason);
  res.json(request);
}));

// Get last extension request
router.get('/extension-request', authenticateToken as any, typedHandler(async (req, res) => {
  const request = await trialService.getLastExtensionRequest(req.user.id);
  res.json(request);
}));

// Get referral info
router.get('/referral', authenticateToken as any, typedHandler(async (req, res) => {
  const info = await trialService.getReferralInfo(req.user.id);
  res.json(info);
}));

// Apply referral extension
router.post('/referral/apply', authenticateToken as any, typedHandler(async (req, res) => {
  const success = await trialService.applyReferralExtension(req.user.id);
  res.json({ success });
}));

// Admin routes
router.post('/extension/:requestId/approve', authenticateToken as any, typedHandler(async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Unauthorized' });
    return;
  }

  const { requestId } = req.params;
  const request = await trialService.approveExtension(requestId);
  res.json(request);
}));

export default router; 