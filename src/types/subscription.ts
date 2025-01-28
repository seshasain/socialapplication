export enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELING = 'CANCELING',
  CANCELLED = 'CANCELLED'
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialStart?: Date | null;
  trialEnd?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Plan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  price: number;
  interval: 'monthly' | 'annual' | 'once';
  features: PlanFeature[];
  limits: PlanLimit[];
}

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  included: boolean;
}

export interface PlanLimit {
  id: string;
  name: string;
  value: number;
  type: 'monthly' | 'total';
} 