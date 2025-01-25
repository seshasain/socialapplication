import { Plan } from '../types/plans';

export const plans: Record<string, Plan> = {
  trial: {
    id: 'trial',
    name: 'Free Trial',
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
    },
    description: '14-day trial with essential features to explore the platform'
  },
  basic: {
    id: 'basic',
    name: 'Basic',
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
    },
    description: 'Perfect for individuals and small businesses'
  },
  pro: {
    id: 'pro',
    name: 'Pro',
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
    },
    description: 'Advanced features for growing businesses and professionals'
  }
}; 