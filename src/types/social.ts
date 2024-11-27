export interface SocialAccount {
    id: string;
    platform: string;
    username?: string;
    profileUrl?: string;
    followerCount: number;
    accessToken?: string;
    refreshToken?: string;
  }
  
  export type PlanTier = 'free' | 'basic' | 'pro';
  
  export interface PlatformConfig {
    id: string;
    name: string;
    color: string;
    minPlan: PlanTier;
    description: string;
  }
  
  export interface PlanFeatures {
    name: string;
    platforms: number | 'Unlimited';
    description: string;
    color: string;
    availablePlatforms: string[];
  }