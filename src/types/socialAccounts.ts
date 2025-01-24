export interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  profilePicture?: string;
  status: 'connected' | 'disconnected' | 'error';
  error?: string;
  lastSync?: string;
  settings?: {
    [key: string]: any;
  };
} 