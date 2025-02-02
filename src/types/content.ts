export interface ContentPost {
  id: string;
  sourceId: string;
  userId: string;
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  status: 'published' | 'draft' | 'error';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  url?: string;
  authors?: Array<{
    name: string;
    avatar?: string;
  }>;
} 