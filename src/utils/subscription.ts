import { SubscriptionStatus } from '../types/subscription';
import { PlanType, PLANS } from '../types/plans';

export type SubscriptionType = 'trial' | 'basic' | 'pro' | 'expired';

export class SubscriptionError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'SubscriptionError';
  }
}

export interface UserSubscription {
  status: SubscriptionStatus;
  planId: string;
  currentPeriodEnd: Date;
  trialEnd?: Date | null;
  type?: SubscriptionType;
  planType?: SubscriptionType;
}

function validateSubscription(subscription: UserSubscription): void {
  if (!Object.values(SubscriptionStatus).includes(subscription.status)) {
    throw new SubscriptionError(
      `Invalid subscription status: ${subscription.status}`,
      'INVALID_STATUS'
    );
  }

  if (typeof subscription.currentPeriodEnd !== 'object' || !(subscription.currentPeriodEnd instanceof Date)) {
    throw new SubscriptionError(
      'Invalid currentPeriodEnd date',
      'INVALID_DATE'
    );
  }

  if (subscription.trialEnd && !(subscription.trialEnd instanceof Date)) {
    throw new SubscriptionError(
      'Invalid trialEnd date',
      'INVALID_DATE'
    );
  }
}

export function getSubscriptionType(subscription?: UserSubscription | null): SubscriptionType {
  if (!subscription) {
    return 'expired';
  }

  try {
    validateSubscription(subscription);

    // Check if subscription is expired
    const now = new Date();
    const periodEnd = new Date(subscription.currentPeriodEnd);
    if (periodEnd < now) {
      return 'expired';
    }

    // Check subscription status and plan
    if (subscription.status === SubscriptionStatus.TRIAL) {
      return 'trial';
    }

    if (subscription.status === SubscriptionStatus.ACTIVE) {
      // Get the plan type from the subscription metadata if available
      if (subscription.type && isValidPlanType(subscription.type)) {
        return subscription.type;
      }

      // If no type field, check planType
      if (subscription.planType && isValidPlanType(subscription.planType)) {
        return subscription.planType;
      }

      // If no metadata, use the planId
      const planId = subscription.planId.toLowerCase();
      if (isValidPlanType(planId)) {
        return planId as SubscriptionType;
      }

      // Default to basic if we can't determine the plan type
      return 'basic';
    }

    return 'expired';
  } catch (error) {
    console.error('Error determining subscription type:', error);
    return 'basic'; // Safe fallback
  }
}

function isValidPlanType(type: string): type is PlanType {
  return type in PLANS;
}

// Cache for subscription types
const subscriptionTypeCache = new Map<string, { type: SubscriptionType; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedSubscriptionType(subscription?: UserSubscription | null): SubscriptionType {
  if (!subscription) {
    return 'expired';
  }

  const cacheKey = `${subscription.status}-${subscription.planId}-${subscription.currentPeriodEnd}`;
  const cached = subscriptionTypeCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.type;
  }

  const type = getSubscriptionType(subscription);
  subscriptionTypeCache.set(cacheKey, { type, timestamp: Date.now() });

  return type;
}

export function isTrialUser(subscription?: UserSubscription | null): boolean {
  return getSubscriptionType(subscription) === 'trial';
}

export function isBasicUser(subscription?: UserSubscription | null): boolean {
  return getSubscriptionType(subscription) === 'basic';
}

export function isProUser(subscription?: UserSubscription | null): boolean {
  return getSubscriptionType(subscription) === 'pro';
}

export function hasActiveSubscription(subscription?: UserSubscription | null): boolean {
  if (!subscription) return false;
  
  const now = new Date();
  const periodEnd = new Date(subscription.currentPeriodEnd);
  
  return (
    periodEnd > now && 
    (subscription.status === SubscriptionStatus.ACTIVE || subscription.status === SubscriptionStatus.TRIAL)
  );
}

export function isSubscriptionExpired(subscription?: UserSubscription | null): boolean {
  if (!subscription) return true;
  
  const now = new Date();
  const periodEnd = new Date(subscription.currentPeriodEnd);
  
  return periodEnd < now || subscription.status === SubscriptionStatus.CANCELLED;
}

export function getTrialDaysLeft(subscription?: UserSubscription | null): number {
  if (!subscription?.trialEnd || subscription.status !== SubscriptionStatus.TRIAL) {
    return 0;
  }

  const now = new Date();
  const trialEnd = new Date(subscription.trialEnd);
  const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return Math.max(0, daysLeft);
} 