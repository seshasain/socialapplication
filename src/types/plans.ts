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
  displayName: string;
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
    displayName: 'Free Trial',
    description: 'Try our platform for 14 days',
    price: {
      monthly: 0,
      annual: 0
    },
    features: [
      'twitter', 
      'facebook', 
      'instagram', 
      'threads',
      'basic_analytics',
      'post_scheduling',
      'content_calendar',
      'hashtag_suggestions'
    ],
    limits: {
      monthlyPosts: 100,
      scheduledPosts: 20,
      analyticsHistory: 14,
      aiSuggestions: 15,
      teamMembers: 1,
      monthlyRollover: false,
      postsPerPlatform: 30
    }
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    displayName: 'Basic',
    description: 'Perfect for individuals and small businesses',
    price: {
      monthly: 9.99,
      annual: 99.99
    },
    features: [
      'twitter', 
      'facebook', 
      'instagram', 
      'threads',
      'linkedin',
      'basic_analytics',
      'post_scheduling',
      'ai_suggestions',
      'content_calendar',
      'hashtag_suggestions',
      'post_metrics',
      'social_inbox',
      'content_library'
    ],
    limits: {
      monthlyPosts: 300,
      scheduledPosts: 50,
      analyticsHistory: 30,
      aiSuggestions: 100,
      teamMembers: 1,
      monthlyRollover: true,
      postsPerPlatform: 100
    }
  },
  pro: {
    id: 'pro',
    name: 'Professional',
    displayName: 'Professional',
    description: 'Advanced features for growing businesses and professionals',
    price: {
      monthly: 19.99,
      annual: 199.99
    },
    features: [
      'twitter', 
      'facebook', 
      'instagram', 
      'threads', 
      'linkedin', 
      'youtube', 
      'pinterest', 
      'tiktok',
      'advanced_analytics',
      'priority_scheduling',
      'bulk_scheduling',
      'ai_content_creation',
      'ab_testing',
      'custom_reports',
      'competitor_analysis',
      'white_label_reports',
      'api_access',
      'team_collaboration',
      'priority_support',
      'advanced_social_inbox',
      'unlimited_content_library'
    ],
    limits: {
      monthlyPosts: 1500,
      scheduledPosts: 300,
      analyticsHistory: 90,
      aiSuggestions: 'unlimited',
      teamMembers: 5,
      monthlyRollover: true,
      postsPerPlatform: 500
    }
  }
}; 