import { PrismaClient, Prisma } from '@prisma/client';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Client as NotionClient } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import axios from 'axios';
import { 
  ContentSource, 
  ContentPost, 
  SyncStatus, 
  GoogleDocsConfig, 
  WordPressConfig,
  NotionConfig,
  NotionPage
} from '../types/integrations';

const prisma = new PrismaClient();

type IntegrationConfig = {
  google_docs?: GoogleDocsConfig;
  wordpress?: WordPressConfig;
  notion?: NotionConfig;
};

interface ValidatedSource {
  id: string;
  userId: string;
  type: ContentSource['type'];
  config: IntegrationConfig;
}

interface NotionProperties {
  [key: string]: {
    type: string;
    title?: Array<{ plain_text: string }>;
    rich_text?: Array<{ plain_text: string }>;
  };
}

interface NotionPageContent {
  id: string;
  properties: NotionProperties;
}

interface GoogleDocsContent {
  body?: {
    content?: Array<{
      paragraph?: {
        elements?: Array<{
          textRun?: {
            content?: string;
          };
        }>;
      };
    }>;
  };
}

interface PrismaContentSource {
  id: string;
  type: string;
  name: string;
  connected: boolean;
  lastSync: Date | null;
  config: Prisma.JsonValue;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

function isValidSourceType(type: string): type is ContentSource['type'] {
  return ['google_docs', 'wordpress', 'notion'].includes(type);
}

function convertToContentSource(prismaSource: PrismaContentSource): ContentSource {
  if (!isValidSourceType(prismaSource.type)) {
    throw new Error(`Invalid source type: ${prismaSource.type}`);
  }

  return {
    id: prismaSource.id,
    userId: prismaSource.userId,
    type: prismaSource.type,
    name: prismaSource.name,
    connected: prismaSource.connected,
    config: prismaSource.config,
    lastSync: prismaSource.lastSync || undefined
  };
}

class IntegrationService {
  private notionClient: NotionClient | null = null;

  constructor() {}

  private validateSource(source: ContentSource): ValidatedSource {
    if (!source.id || !source.userId) {
      throw new Error('Invalid source: missing required fields');
    }

    if (!isValidSourceType(source.type)) {
      throw new Error('Invalid source type');
    }

    return {
      id: source.id,
      userId: source.userId,
      type: source.type,
      config: source.config as IntegrationConfig,
    };
  }

  private async createGoogleDocsClient(credentials: GoogleDocsConfig): Promise<any> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing required Google OAuth configuration');
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    oauth2Client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
    });
    return oauth2Client;
  }

  async connectGoogleDocs(userId: string, credentials: GoogleDocsConfig): Promise<{ success: boolean; source: ContentSource }> {
    try {
      const oauth2Client = await this.createGoogleDocsClient(credentials);
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      // Test the connection
      await drive.files.list({
        pageSize: 1,
        fields: 'files(id, name)',
      });

      const config: Prisma.InputJsonValue = {
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
        folderId: credentials.folderId,
        watchMode: 'polling',
        autoSync: true,
      };

      // Save the integration
      const source = await prisma.contentSource.create({
        data: {
          type: 'google_docs',
          name: 'Google Docs',
          connected: true,
          userId,
          config,
        },
      });

      const validatedSource: PrismaContentSource = {
        ...source,
        type: 'google_docs'
      };

      return { success: true, source: convertToContentSource(validatedSource) };
    } catch (error) {
      console.error('Failed to connect Google Docs:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to connect to Google Docs');
    }
  }

  async connectWordPress(userId: string, config: WordPressConfig): Promise<{ success: boolean; source: ContentSource }> {
    try {
      // Validate WordPress connection
      const response = await axios.get(`${config.siteUrl}/wp-json/wp/v2/posts`, {
        params: { per_page: 1 },
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
        },
      });

      if (response.status !== 200) {
        throw new Error('Failed to connect to WordPress site');
      }

      const wpConfig: Prisma.InputJsonValue = {
        siteUrl: config.siteUrl,
        accessToken: config.accessToken,
        postTypes: config.postTypes,
        autoPost: false,
      };

      // Save the integration
      const source = await prisma.contentSource.create({
        data: {
          type: 'wordpress',
          name: 'WordPress',
          connected: true,
          userId,
          config: wpConfig,
        },
      });

      const validatedSource: PrismaContentSource = {
        ...source,
        type: 'wordpress'
      };

      return { success: true, source: convertToContentSource(validatedSource) };
    } catch (error) {
      console.error('Failed to connect WordPress:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid WordPress access token');
        } else if (error.response?.status === 404) {
          throw new Error('WordPress site not found or REST API not enabled');
        }
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to connect to WordPress');
    }
  }

  async connectNotion(userId: string, config: NotionConfig): Promise<{ success: boolean; source: ContentSource }> {
    try {
      // Initialize Notion client
      this.notionClient = new NotionClient({ auth: config.accessToken });

      // Test the connection by trying to access the database
      await this.notionClient.databases.retrieve({ database_id: config.databaseId });

      const notionConfig: Prisma.InputJsonValue = {
        accessToken: config.accessToken,
        databaseId: config.databaseId,
        syncInterval: 15,
        autoSync: true,
      };

      // Save the integration
      const source = await prisma.contentSource.create({
        data: {
          type: 'notion',
          name: 'Notion',
          connected: true,
          userId,
          config: notionConfig,
        },
      });

      const validatedSource: PrismaContentSource = {
        ...source,
        type: 'notion'
      };

      return { success: true, source: convertToContentSource(validatedSource) };
    } catch (error) {
      console.error('Failed to connect Notion:', error);
      if (error instanceof Error && error.message.includes('API token')) {
        throw new Error('Invalid Notion access token');
      } else if (error instanceof Error && error.message.includes('database_id')) {
        throw new Error('Invalid Notion database ID');
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to connect to Notion');
    }
  }

  async syncContent(sourceId: string): Promise<{ success: boolean; itemsProcessed: number }> {
    try {
      // Start sync status
      const syncStatus = await prisma.syncStatus.create({
        data: {
          sourceId,
          status: 'in_progress',
          itemsProcessed: 0,
        },
      });

      const source = await prisma.contentSource.findUnique({
        where: { id: sourceId },
      });

      if (!source) {
        throw new Error('Source not found');
      }

      const validatedSource: PrismaContentSource = {
        ...source,
        type: source.type
      };

      if (!isValidSourceType(validatedSource.type)) {
        throw new Error('Invalid source type');
      }

      const contentSource = convertToContentSource(validatedSource);
      const validSource = this.validateSource(contentSource);
      let itemsProcessed = 0;

      switch (validSource.type) {
        case 'google_docs':
          itemsProcessed = await this.syncGoogleDocs(validSource);
          break;
        case 'wordpress':
          itemsProcessed = await this.syncWordPress(validSource);
          break;
        case 'notion':
          itemsProcessed = await this.syncNotion(validSource);
          break;
        default:
          throw new Error('Unsupported integration type');
      }

      // Update sync status
      await prisma.syncStatus.update({
        where: { id: syncStatus.id },
        data: {
          status: 'success',
          itemsProcessed,
        },
      });

      // Update source last sync time
      await prisma.contentSource.update({
        where: { id: sourceId },
        data: { lastSync: new Date() },
      });

      return { success: true, itemsProcessed };
    } catch (error) {
      // Update sync status with error
      await prisma.syncStatus.update({
        where: { id: sourceId },
        data: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      });
      throw error;
    }
  }

  private async syncGoogleDocs(source: ValidatedSource): Promise<number> {
    const config = source.config.google_docs;
    if (!config) throw new Error('Invalid Google Docs configuration');

    const oauth2Client = await this.createGoogleDocsClient(config);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const docs = google.docs({ version: 'v1', auth: oauth2Client });

    // Get files from the specified folder or root
    const response = await drive.files.list({
      q: config.folderId 
        ? `'${config.folderId}' in parents`
        : "'root' in parents",
      fields: 'files(id, name, modifiedTime)',
    });

    let itemsProcessed = 0;
    const files = response.data.files as Array<{ id: string; name: string }>;

    if (files) {
      for (const file of files) {
        try {
          // Skip files without required fields
          if (!file.id || !file.name) {
            console.warn('Skipping file with missing required fields:', file);
            continue;
          }

          // Get document content
          const doc = await docs.documents.get({
            documentId: file.id,
          });

          const metadata: Prisma.InputJsonValue = {};

          // Create or update post
          await prisma.contentPost.upsert({
            where: {
              sourceId_externalId: {
                sourceId: source.id,
                externalId: file.id,
              },
            },
            create: {
              sourceId: source.id,
              userId: source.userId,
              title: file.name,
              content: this.extractContent(doc.data as GoogleDocsContent),
              status: 'draft',
              externalId: file.id,
              platforms: [],
              images: [],
              metadata,
            },
            update: {
              title: file.name,
              content: this.extractContent(doc.data as GoogleDocsContent),
            },
          });

          itemsProcessed++;
        } catch (error) {
          console.error(`Failed to process document ${file.id}:`, error);
        }
      }
    }

    return itemsProcessed;
  }

  private async syncWordPress(source: ValidatedSource): Promise<number> {
    let itemsProcessed = 0;
    const config = source.config.wordpress;
    if (!config) throw new Error('Invalid WordPress configuration');

    try {
      const response = await axios.get(`${config.siteUrl}/wp-json/wp/v2/posts`, {
        headers: {
          Authorization: `Bearer ${(source.config as unknown as WordPressConfig).accessToken}`,
        },
      });

      for (const post of response.data) {
        await prisma.contentPost.upsert({
          where: {
            sourceId_externalId: {
              sourceId: source.id,
              externalId: post.id.toString(),
            },
          },
          create: {
            sourceId: source.id,
            userId: source.userId,
            title: post.title.rendered,
            content: post.content.rendered,
            status: 'draft',
            externalId: post.id.toString(),
            platforms: [],
            images: [],
            metadata: {},
          },
          update: {
            title: post.title.rendered,
            content: post.content.rendered,
          },
        });

        itemsProcessed++;
      }
    } catch (error) {
      console.error('Failed to sync WordPress posts:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('WordPress access token expired or invalid');
        }
      }
      throw error;
    }

    return itemsProcessed;
  }

  private async syncNotion(source: ValidatedSource): Promise<number> {
    const config = source.config.notion;
    if (!config) throw new Error('Invalid Notion configuration');

    if (!this.notionClient) {
      this.notionClient = new NotionClient({ 
        auth: (source.config as unknown as NotionConfig).accessToken 
      });
    }

    try {
      const response = await this.notionClient.databases.query({
        database_id: config.databaseId,
      });

      let itemsProcessed = 0;

      for (const page of response.results) {
        // Type guard to ensure we have a valid page object
        if (!this.isValidPageObject(page)) continue;

        const content = await this.notionClient.pages.retrieve({ 
          page_id: page.id 
        }) as NotionPageContent;
        
        // Extract title and content with type safety
        const title = this.extractNotionTitle(content.properties);
        const pageContent = this.extractNotionContent(content.properties);

        // Create the content post with validated fields
        await prisma.contentPost.upsert({
          where: {
            sourceId_externalId: {
              sourceId: source.id,
              externalId: page.id,
            },
          },
          create: {
            sourceId: source.id,
            userId: source.userId,
            title,
            content: pageContent,
            status: 'draft',
            externalId: page.id,
            platforms: [],
            images: [],
            metadata: {},
          },
          update: {
            title,
            content: pageContent,
          },
        });

        itemsProcessed++;
      }

      return itemsProcessed;
    } catch (error) {
      console.error('Failed to sync Notion pages:', error);
      if (error instanceof Error && error.message.includes('API token')) {
        throw new Error('Notion access token expired or invalid');
      }
      throw error;
    }
  }

  private isValidPageObject(page: unknown): page is PageObjectResponse {
    return (
      typeof page === 'object' &&
      page !== null &&
      'id' in page &&
      typeof (page as PageObjectResponse).id === 'string'
    );
  }

  private extractNotionTitle(properties: NotionProperties): string {
    const titleProp = properties['title'];
    if (titleProp?.type === 'title' && titleProp.title && titleProp.title.length > 0) {
      return titleProp.title[0].plain_text;
    }
    return 'Untitled';
  }

  private extractNotionContent(properties: NotionProperties): string {
    const contentProp = properties['content'];
    if (contentProp?.type === 'rich_text' && contentProp.rich_text && contentProp.rich_text.length > 0) {
      return contentProp.rich_text[0].plain_text;
    }
    return '';
  }

  private extractContent(doc: GoogleDocsContent): string {
    return doc.body?.content
      ?.map(item => item.paragraph?.elements
        ?.map(element => element.textRun?.content || '')
        .join('') || '')
      .join('\n') || '';
  }
}

export const integrationService = new IntegrationService(); 