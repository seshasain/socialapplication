import { SocialPlatform } from './plans';

export interface TrialLimits {
  maxPostsPerDay: number;
  maxAnalyticsDays: number;
  availablePlatforms: SocialPlatform[];
  maxScheduledPosts: number;
  maxTeamMembers: number;
}

export interface TrialUsage {
  postsToday: number;
  totalPosts: number;
  scheduledPosts: number;
  lastPostDate?: Date;
  referralCount: number;
  teamMembers: number;
}

export interface TrialExtensionRequest {
  id: string;
  userId: string;
  reason: string;
  requestedDays: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export interface ReferralInfo {
  code: string;
  referredUsers: number;
  daysEarned: number;
  maxDaysEarnable: number;
  referralLink: string;
}

export const TRIAL_LIMITS: TrialLimits = {
  maxPostsPerDay: 3,
  maxAnalyticsDays: 7,
  availablePlatforms: ['twitter', 'facebook', 'instagram', 'threads'],
  maxScheduledPosts: 5,
  maxTeamMembers: 1
}; 