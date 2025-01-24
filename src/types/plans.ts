export type PlanType = 'trial' | 'basic' | 'pro';

export type SocialPlatform = 
  | 'twitter'
  | 'facebook'
  | 'instagram'
  | 'threads'
  | 'linkedin'
  | 'youtube'
  | 'pinterest'
  | 'tiktok';

export interface Plan {
  id: PlanType;
  name: string;
  price: {
    monthly: number;
    annual: number;
  };
  features: SocialPlatform[];
  description: string;
}

export const PLANS: Record<PlanType, Plan> = {
  trial: {
    id: 'trial',
    name: 'Free Trial',
    description: '7 days free access to Basic features',
    price: {
      monthly: 0,
      annual: 0
    },
    features: ['twitter', 'facebook', 'instagram', 'threads']
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    description: 'Essential social media management',
    price: {
      monthly: 9.99,
      annual: 9.99
    },
    features: ['twitter', 'facebook', 'instagram', 'threads']
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced social media management',
    price: {
      monthly: 29.99,
      annual: 29.99
    },
    features: ['twitter', 'facebook', 'instagram', 'threads', 'linkedin', 'youtube', 'pinterest', 'tiktok']
  }
}; 