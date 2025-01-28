import { Client } from '@notionhq/client';
import { 
  NotionConfig, 
  NotionPost, 
  NotionDatabase, 
  PostStatus,
  NotionError 
} from '../../types/notion';

class NotionService {
  private client: Client | null = null;
  private config: NotionConfig | null = null;

  async initialize(config: NotionConfig): Promise<void> {
    try {
      this.client = new Client({ auth: config.accessToken });
      this.config = config;
      // Test the connection
      await this.client.databases.retrieve({ database_id: config.databaseId });
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getDatabases(): Promise<NotionDatabase[]> {
    if (!this.client) throw new Error('Notion client not initialized');

    try {
      const response = await this.client.search({
        filter: { property: 'object', value: 'database' }
      });

      return response.results.map((db: any) => ({
        id: db.id,
        title: db.title[0]?.plain_text || 'Untitled',
        description: db.description?.[0]?.plain_text
      }));
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async fetchPosts(): Promise<NotionPost[]> {
    if (!this.client || !this.config) throw new Error('Notion client not initialized');

    try {
      const response = await this.client.databases.query({
        database_id: this.config.databaseId,
        sorts: [{ property: 'scheduledTime', direction: 'ascending' }]
      });

      return response.results.map((page) => this.convertToPost(page));
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async createPost(post: NotionPost): Promise<string> {
    if (!this.client || !this.config) throw new Error('Notion client not initialized');

    try {
      const response = await this.client.pages.create({
        parent: { database_id: this.config.databaseId },
        properties: this.convertToNotionProperties(post)
      });

      return response.id;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updatePostStatus(postId: string, status: PostStatus): Promise<void> {
    if (!this.client) throw new Error('Notion client not initialized');

    try {
      await this.client.pages.update({
        page_id: postId,
        properties: {
          status: {
            select: {
              name: status
            }
          }
        }
      });
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private convertToPost(notionPage: any): NotionPost {
    return {
      id: notionPage.id,
      title: notionPage.properties.title?.title[0]?.plain_text || '',
      content: notionPage.properties.content?.rich_text[0]?.plain_text || '',
      platforms: notionPage.properties.platforms?.multi_select?.map((p: any) => p.name) || [],
      scheduledTime: new Date(notionPage.properties.scheduledTime?.date?.start || Date.now()),
      status: notionPage.properties.status?.select?.name || PostStatus.DRAFT,
      images: notionPage.properties.images?.files?.map((f: any) => f.file.url) || []
    };
  }

  private convertToNotionProperties(post: NotionPost): any {
    return {
      title: {
        title: [{ text: { content: post.title } }]
      },
      content: {
        rich_text: [{ text: { content: post.content } }]
      },
      platforms: {
        multi_select: post.platforms.map(platform => ({ name: platform }))
      },
      scheduledTime: {
        date: { start: post.scheduledTime.toISOString() }
      },
      status: {
        select: { name: post.status }
      },
      images: {
        files: post.images?.map(url => ({ name: url, file: { url } })) || []
      }
    };
  }

  private handleError(error: any): NotionError {
    return {
      message: error.message || 'An error occurred with the Notion integration',
      code: error.code || 'NOTION_ERROR',
      details: error.details
    };
  }
}

export const notionService = new NotionService(); 