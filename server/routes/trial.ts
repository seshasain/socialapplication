import { Router, Request, Response, NextFunction } from 'express';
import { authenticateUser } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';
import { TrialService } from '../services/trial.service';

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
router.get('/status', authenticateUser, typedHandler(async (req, res) => {
  const status = await trialService.getTrialStatus(req.user.id);
  res.json(status);
}));

// Get trial usage
router.get('/usage', authenticateUser, typedHandler(async (req, res) => {
  const usage = await trialService.getTrialUsage(req.user.id);
  res.json(usage);
}));

// Request trial extension
router.post('/extend', authenticateUser, typedHandler(async (req, res) => {
  const { days, reason } = req.body;

  if (!days || !reason) {
    res.status(400).json({ error: 'Days and reason are required' });
    return;
  }

  const request = await trialService.extendTrial(req.user.id, days, reason);
  res.json(request);
}));

// Get last extension request
router.get('/extension-request', authenticateUser, typedHandler(async (req, res) => {
  const request = await trialService.getLastExtensionRequest(req.user.id);
  res.json(request);
}));

// Get referral info
router.get('/referral', authenticateUser, typedHandler(async (req, res) => {
  const info = await trialService.getReferralInfo(req.user.id);
  res.json(info);
}));

// Apply referral extension
router.post('/referral/apply', authenticateUser, typedHandler(async (req, res) => {
  const success = await trialService.applyReferralExtension(req.user.id);
  res.json({ success });
}));

// Admin routes
router.post('/extension/:requestId/approve', authenticateUser, typedHandler(async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Unauthorized' });
    return;
  }

  const { requestId } = req.params;
  const request = await trialService.approveExtension(requestId);
  res.json(request);
}));

export default router; 