import { Router, Request, Response, NextFunction } from 'express';
import { authenticateUser } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';
import { SubscriptionService } from '../services/subscription.service';

const router = Router();
const subscriptionService = new SubscriptionService();

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

// Get current plan
router.get('/current-plan', authenticateUser, typedHandler(async (req, res) => {
  const plan = await subscriptionService.getCurrentPlan(req.user.id);
  
  if (!plan) {
    res.status(404).json({ error: 'No active subscription found' });
    return;
  }

  res.json(plan);
}));

// Upgrade plan
router.post('/upgrade', authenticateUser, typedHandler(async (req, res) => {
  const { planId, preserveUnusedPosts, transferSettings, startImmediately } = req.body;

  await subscriptionService.upgradePlan(req.user.id, planId, {
    preserveUnusedPosts,
    transferSettings,
    startImmediately
  });

  res.json({ success: true });
}));

// Cancel subscription
router.post('/cancel', authenticateUser, typedHandler(async (req, res) => {
  await subscriptionService.cancelSubscription(req.user.id);
  res.json({ success: true });
}));

// Reactivate subscription
router.post('/reactivate', authenticateUser, typedHandler(async (req, res) => {
  await subscriptionService.reactivateSubscription(req.user.id);
  res.json({ success: true });
}));

// Update payment method
router.put('/payment-method', authenticateUser, typedHandler(async (req, res) => {
  const { paymentMethodId } = req.body;
  await subscriptionService.updatePaymentMethod(req.user.id, paymentMethodId);
  res.json({ success: true });
}));

// Get upgrade preview
router.get('/upgrade-preview', authenticateUser, typedHandler(async (req, res) => {
  const { planId } = req.query;
  
  if (typeof planId !== 'string') {
    res.status(400).json({ error: 'Invalid plan ID' });
    return;
  }

  try {
    const preview = await subscriptionService.getUpgradePreview(req.user.id, planId);
    res.json(preview);
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid plan ID') {
      res.status(400).json({ error: error.message });
    } else {
      throw error;
    }
  }
}));

export default router; 