import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { ContentSource, ContentPost, SyncStatus, GoogleDocsConfig, WordPressConfig } from '../types/integrations';

const prisma = new PrismaClient();

class IntegrationService {
  constructor() {}

  private async createGoogleDocsClient(credentials: GoogleDocsConfig): Promise<OAuth2Client> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
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
      throw new Error(error instanceof Error ? error.message : 'Failed to connect to WordPress');
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

      if (source.type === 'google_docs') {
        itemsProcessed = await this.syncGoogleDocs(source);
      } else if (source.type === 'wordpress') {
        itemsProcessed = await this.syncWordPress(source);
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
      throw error;
    }

    return itemsProcessed;
  }

  private extractContent(doc: any): string {
    if (!doc.body?.content) {
      return '';
    }

    return doc.body.content
      .map((element: any) => {
        if (element.paragraph) {
          return element.paragraph.elements
            .map((e: any) => e.textRun?.content || '')
            .join('');
        }
        return '';
      })
      .join('\n');
  }
}

export const integrationService = new IntegrationService(); 