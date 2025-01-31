import { PrismaClient } from '@prisma/client';
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

interface ValidatedSource {
  id: string;
  userId: string;
  type: 'google_docs' | 'wordpress' | 'notion';
  config: any;
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

class IntegrationService {
  private notionClient: NotionClient | null = null;

  constructor() {}

  private validateSource(source: ContentSource): ValidatedSource {
    if (!source.id || !source.userId) {
      throw new Error('Invalid source: missing required fields');
    }
    return {
      id: source.id,
      userId: source.userId,
      type: source.type,
      config: source.config,
    };
  }

  private async createGoogleDocsClient(credentials: GoogleDocsConfig): Promise<OAuth2Client> {
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

      // Save the integration
      const source = await prisma.contentSource.create({
        data: {
          type: 'google_docs',
          name: 'Google Docs',
          connected: true,
          userId,
          config: {
            accessToken: credentials.accessToken,
            refreshToken: credentials.refreshToken,
            folderId: credentials.folderId,
          },
        },
      }) as unknown as ContentSource;

      return { success: true, source };
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

      // Save the integration
      const source = await prisma.contentSource.create({
        data: {
          type: 'wordpress',
          name: 'WordPress',
          connected: true,
          userId,
          config: {
            siteUrl: config.siteUrl,
            accessToken: config.accessToken,
            postTypes: config.postTypes,
          },
        },
      }) as unknown as ContentSource;

      return { success: true, source };
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

      // Save the integration
      const source = await prisma.contentSource.create({
        data: {
          type: 'notion',
          name: 'Notion',
          connected: true,
          userId,
          config: {
            accessToken: config.accessToken,
            databaseId: config.databaseId,
          },
        },
      }) as unknown as ContentSource;

      return { success: true, source };
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
      }) as unknown as SyncStatus;

      const source = await prisma.contentSource.findUnique({
        where: { id: sourceId },
      }) as unknown as ContentSource;

      if (!source) {
        throw new Error('Source not found');
      }

      let itemsProcessed = 0;

      switch (source.type) {
        case 'google_docs':
          itemsProcessed = await this.syncGoogleDocs(source);
          break;
        case 'wordpress':
          itemsProcessed = await this.syncWordPress(source);
          break;
        case 'notion':
          itemsProcessed = await this.syncNotion(source);
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

  private async syncGoogleDocs(source: ContentSource): Promise<number> {
    const oauth2Client = await this.createGoogleDocsClient(source.config as GoogleDocsConfig);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const docs = google.docs({ version: 'v1', auth: oauth2Client });

    // Get files from the specified folder or root
    const response = await drive.files.list({
      q: (source.config as GoogleDocsConfig).folderId 
        ? `'${(source.config as GoogleDocsConfig).folderId}' in parents`
        : "'root' in parents",
      fields: 'files(id, name, modifiedTime)',
    });

    let itemsProcessed = 0;

    for (const file of response.data.files || []) {
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
            content: this.extractContent(doc.data),
            status: 'draft',
            externalId: file.id,
            platforms: [],
            images: [],
            metadata: {},
          },
          update: {
            title: file.name,
            content: this.extractContent(doc.data),
          },
        }) as unknown as ContentPost;

        itemsProcessed++;
      } catch (error) {
        console.error(`Failed to process document ${file.id}:`, error);
      }
    }

    return itemsProcessed;
  }

  private async syncWordPress(source: ContentSource): Promise<number> {
    let itemsProcessed = 0;
    const config = source.config as WordPressConfig;

    try {
      const response = await axios.get(`${config.siteUrl}/wp-json/wp/v2/posts`, {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
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
        }) as unknown as ContentPost;

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

  private async syncNotion(source: ContentSource): Promise<number> {
    const validatedSource = this.validateSource(source);
    let itemsProcessed = 0;
    const config = validatedSource.config as NotionConfig;

    if (!this.notionClient) {
      this.notionClient = new NotionClient({ auth: config.accessToken });
    }

    try {
      const response = await this.notionClient.databases.query({
        database_id: config.databaseId,
      });

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
        const contentPost: Omit<ContentPost, 'id'> = {
          sourceId: validatedSource.id,
          userId: validatedSource.userId,
          title,
          content: pageContent,
          status: 'draft',
          externalId: page.id,
          platforms: [],
          images: [],
          metadata: {},
        };

        await prisma.contentPost.upsert({
          where: {
            sourceId_externalId: {
              sourceId: validatedSource.id,
              externalId: page.id,
            },
          },
          create: contentPost,
          update: {
            title,
            content: pageContent,
          },
        }) as unknown as ContentPost;

        itemsProcessed++;
      }
    } catch (error) {
      console.error('Failed to sync Notion pages:', error);
      if (error instanceof Error && error.message.includes('API token')) {
        throw new Error('Notion access token expired or invalid');
      }
      throw error;
    }

    return itemsProcessed;
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

  private extractContent(doc: any): string {
    // Implement content extraction logic based on your needs
    return doc.body?.content
      ?.map((item: any) => item.paragraph?.elements
        ?.map((element: any) => element.textRun?.content || '')
        .join('') || '')
      .join('\n') || '';
  }
}

export const integrationService = new IntegrationService(); 