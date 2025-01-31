export interface ContentSource {
  id: string;
  type: 'google_docs' | 'wordpress' | 'notion';
  name: string;
  connected: boolean;
  lastSync?: Date;
  config: any;
  userId: string;
}

export interface ContentPost {
  id: string;
  sourceId: string;
  userId: string;
  title: string;
  content: string;
  platforms: string[];
  status: string;
  scheduledTime?: Date;
  images: string[];
  metadata: any;
  externalId: string;
}

export interface SyncStatus {
  id: string;
  sourceId: string;
  status: 'success' | 'error' | 'in_progress';
  itemsProcessed: number;
  error?: string;
  createdAt: Date;
}

export interface GoogleDocsConfig {
  accessToken: string;
  refreshToken: string;
  folderId?: string;
}

export interface WordPressConfig {
  siteUrl: string;
  accessToken: string;
  postTypes: string[];
}

export interface NotionConfig {
  accessToken: string;
  databaseId: string;
}

export interface NotionPage {
  id: string;
  properties: {
    title: {
      title: Array<{
        plain_text: string;
      }>;
    };
    content: {
      rich_text: Array<{
        plain_text: string;
      }>;
    };
  };
} 