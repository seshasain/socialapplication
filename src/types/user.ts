import { PlanType } from './plans';
import { SubscriptionStatus } from './subscription';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscription?: {
    id: string;
    status: SubscriptionStatus;
    planId: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialStart?: Date | null;
    trialEnd?: Date | null;
    cancelAtPeriodEnd: boolean;
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