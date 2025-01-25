export interface PlanLimits {
  monthlyPosts: number;
  maxRollover: number;
  perPlatformPosts: number;
  scheduledPosts: number;
}

export interface PlanPrice {
  monthly: number;
  yearly: number;
}

export interface PlanConfig {
  name: string;
  description: string;
  price: PlanPrice;
  limits: PlanLimits;
  features: string[];
}

export const plans: Record<string, PlanConfig> = {
  free: {
    name: 'Free',
    description: 'Basic social media management',
    price: {
      monthly: 0,
      yearly: 0
    },
    limits: {
      monthlyPosts: 10,
      maxRollover: 0,
      perPlatformPosts: 5,
      scheduledPosts: 5
    },
    features: [
      'Basic scheduling',
      'Single platform support',
      'Basic analytics'
    ]
  },
  pro: {
    name: 'Pro',
    description: 'Advanced social media management',
    price: {
      monthly: 29,
      yearly: 290
    },
    limits: {
      monthlyPosts: 100,
      maxRollover: 20,
      perPlatformPosts: 30,
      scheduledPosts: 50
    },
    features: [
      'Advanced scheduling',
      'Multi-platform support',
      'Advanced analytics',
      'Post rollover',
      'Priority support'
    ]
  },
  business: {
    name: 'Business',
    description: 'Complete social media management solution',
    price: {
      monthly: 99,
      yearly: 990
    },
    limits: {
      monthlyPosts: 500,
      maxRollover: 100,
      perPlatformPosts: 150,
      scheduledPosts: 250
    },
    features: [
      'Enterprise scheduling',
      'Unlimited platforms',
      'Advanced analytics',
      'Post rollover',
      'Priority support',
      'Team collaboration',
      'Custom branding'
    ]
  }
}; 