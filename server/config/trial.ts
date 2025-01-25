export interface TrialLimits {
  maxPostsPerDay: number;
  maxAnalyticsDays: number;
  availablePlatforms: string[];
  maxScheduledPosts: number;
  maxTeamMembers: number;
  maxPostsPerPlatform: number;
  trialDurationDays: number;
  maxExtensionDays: number;
  maxReferralExtensionDays: number;
}

export const TRIAL_LIMITS: TrialLimits = {
  maxPostsPerDay: 3,
  maxAnalyticsDays: 7,
  availablePlatforms: ['facebook', 'instagram', 'threads', 'linkedin'],
  maxScheduledPosts: 5,
  maxTeamMembers: 1,
  maxPostsPerPlatform: 10,
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

export const TRIAL_REFERRAL_CONFIG = {
  daysPerReferral: 2,
  maxReferrals: 15, // Maximum number of referrals that count towards trial extension
  referralCodeLength: 8
}; 