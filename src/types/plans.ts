export type PlanType = 'trial' | 'basic' | 'pro';

export type BasicPlatform = 
  | 'facebook'
  | 'instagram'
  | 'threads'
  | 'linkedin';

export type ProPlatform = 
  | 'twitter'
  | 'youtube'
  | 'pinterest'
  | 'tiktok';

export type SocialPlatform = BasicPlatform | ProPlatform;

export type PlanFeature =
  | SocialPlatform
  | 'basic_analytics'
  | 'advanced_analytics'
  | 'post_scheduling'
  | 'priority_scheduling'
  | 'ai_suggestions'
  | 'ai_content_creation'
  | 'team_collaboration'
  | 'priority_support'
  | 'content_calendar'
  | 'hashtag_suggestions'
  | 'post_metrics'
  | 'bulk_scheduling'
  | 'ab_testing'
  | 'custom_reports'
  | 'competitor_analysis'
  | 'white_label_reports'
  | 'api_access'
  | 'social_inbox'
  | 'advanced_social_inbox'
  | 'content_library'
  | 'unlimited_content_library';

export interface PlanLimits {
  monthlyPosts: number | 'unlimited';
  scheduledPosts: number | 'unlimited';
  analyticsHistory: number;
  aiSuggestions: number | 'unlimited';
  teamMembers: number;
  monthlyRollover?: boolean;
  postsPerPlatform?: number | 'unlimited';
}

export interface Plan {
  id: PlanType;
  name: string;
  price: {
    monthly: number;
    annual: number;
  };
  features: PlanFeature[];
  limits: PlanLimits;
  description: string;
}

export const BASIC_PLATFORMS: BasicPlatform[] = [
  'facebook',
  'instagram',
  'threads',
  'linkedin'
];

export const PRO_PLATFORMS: ProPlatform[] = [
  'twitter',
  'youtube',
  'pinterest',
  'tiktok'
];

export const ALL_PLATFORMS: SocialPlatform[] = [...BASIC_PLATFORMS, ...PRO_PLATFORMS];

export const PLATFORM_NAMES: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram Business',
  threads: 'Threads',
  linkedin: 'LinkedIn',
  twitter: 'Twitter',
  youtube: 'YouTube Community',
  pinterest: 'Pinterest',
  tiktok: 'TikTok'
};

export const PLANS: Record<PlanType, Plan> = {
  trial: {
    id: 'trial',
    name: 'Free Trial',
    description: 'Try our platform for 14 days',
    price: {
      monthly: 0,
      annual: 0
    },
    features: [
      'facebook',
      'instagram',
      'basic_analytics',
      'post_scheduling',
      'hashtag_suggestions'
    ],
    limits: {
      monthlyPosts: 30,
      scheduledPosts: 10,
      analyticsHistory: 7,
      aiSuggestions: 10,
      teamMembers: 1,
      postsPerPlatform: 10
    }
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for individuals and small businesses',
    price: {
      monthly: 9.99,
      annual: 99.99
    },
    features: [
      'facebook',
      'instagram',
      'threads',
      'linkedin',
      'basic_analytics',
      'post_scheduling',
      'content_calendar',
      'hashtag_suggestions',
      'post_metrics',
      'content_library'
    ],
    limits: {
      monthlyPosts: 100,
      scheduledPosts: 30,
      analyticsHistory: 30,
      aiSuggestions: 50,
      teamMembers: 2,
      monthlyRollover: true,
      postsPerPlatform: 30
    }
  },
  pro: {
    id: 'pro',
    name: 'Professional',
    description: 'For growing businesses and teams',
    price: {
      monthly: 29.99,
      annual: 299.99
    },
    features: [
      // Basic platforms
      'facebook',
      'instagram',
      'threads',
      'linkedin',
      // Pro platforms
      'twitter',
      'youtube',
      'pinterest',
      'tiktok',
      // Basic features
      'basic_analytics',
      'post_scheduling',
      'content_calendar',
      'hashtag_suggestions',
      'post_metrics',
      'content_library',
      // Pro features
      'advanced_analytics',
      'priority_scheduling',
      'ai_suggestions',
      'team_collaboration',
      'priority_support',
      'bulk_scheduling'
    ],
    limits: {
      monthlyPosts: 'unlimited',
      scheduledPosts: 'unlimited',
      analyticsHistory: 365,
      aiSuggestions: 'unlimited',
      teamMembers: 10,
      monthlyRollover: true,
      postsPerPlatform: 'unlimited'
    }
  }
}; 