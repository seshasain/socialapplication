import { SocialPlatform } from './plans';

export interface TrialLimits {
  maxPostsPerDay: number;
  maxAnalyticsDays: number;
  availablePlatforms: SocialPlatform[];
  maxScheduledPosts: number;
  maxTeamMembers: number;
  maxPostsPerPlatform: number;
  trialDurationDays: number;
  maxExtensionDays: number;
  maxReferralExtensionDays: number;
}

export interface TrialUsage {
  postsToday: number;
  totalPosts: number;
  scheduledPosts: number;
  referralCount: number;
  teamMembers: number;
  platformUsage: {
    [platform: string]: number;
  };
}

export interface TrialExtensionRequest {
  id: string;
  userId: string;
  reason: string;
  requestedDays: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralInfo {
  code: string;
  referredUsers: number;
  daysEarned: number;
  maxDaysEarnable: number;
  referralLink: string;
}

export const TRIAL_LIMITS: TrialLimits = {
  maxPostsPerDay: 5,
  maxAnalyticsDays: 7,
  availablePlatforms: ['facebook', 'instagram', 'threads', 'linkedin'],
  maxScheduledPosts: 10,
  maxTeamMembers: 2,
  maxPostsPerPlatform: 20,
  trialDurationDays: 14,
  maxExtensionDays: 7,
  maxReferralExtensionDays: 30
};

export const TRIAL_EXTENSION_REASONS = [
  'Need more time to evaluate features',
  'Waiting for team approval',
  'Technical setup in progress',
  'Integration testing',
  'Other'
] as const;

export type TrialExtensionReason = typeof TRIAL_EXTENSION_REASONS[number] | string;

export interface TrialState {
  isActive: boolean;
  daysLeft: number;
  usage: TrialUsage;
  hasRequestedExtension: boolean;
  lastExtensionRequest: TrialExtensionRequest | null;
  referralInfo: ReferralInfo | null;
} 