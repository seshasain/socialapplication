export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscription: {
    planId: string;
    status: string;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
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
  createdAt?: string;
  updatedAt?: string;
}