import { Plan } from '../types/plans';

export const plans: Record<string, Plan> = {
  trial: {
    id: 'trial',
    name: 'Free Trial',
    price: {
      monthly: 0,
      annual: 0
    },
    features: ['twitter', 'facebook', 'instagram', 'threads'],
    description: '7-day free trial with Basic plan features'
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: {
      monthly: 9.99,
      annual: 99.99
    },
    features: ['twitter', 'facebook', 'instagram', 'threads'],
    description: 'Essential social media management'
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: {
      monthly: 19.99,
      annual: 199.99
    },
    features: ['twitter', 'facebook', 'instagram', 'threads', 'linkedin', 'youtube', 'pinterest', 'tiktok'],
    description: 'Advanced social media management for professionals'
  }
}; 