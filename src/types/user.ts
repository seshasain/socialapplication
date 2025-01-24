import { PlanType } from './plans';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscription: {
    planId: PlanType;
    status: 'active' | 'inactive' | 'cancelled' | 'trial';
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
    trialStart: Date | null;
    trialEnd: Date | null;
    isInTrial: boolean;
  };
  settings?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    language: string;
    theme: string;
    autoSchedule: boolean;
    defaultVisibility: string;
  };
  timezone?: string;
  bio?: string;
  avatar?: string;
  socialAccounts?: Array<{
    id: string;
    platform: string;
    username?: string;
    profileUrl?: string;
    followerCount: number;
  }>;
  emailVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}