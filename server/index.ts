import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import multer from 'multer';
import sharp from 'sharp';
import AWS from 'aws-sdk';
import path from 'path';
import { scheduleJob } from 'node-schedule';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import mediaRoutes from './routes/media';
import integrationsRouter from './routes/integrations';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import B2 from 'backblaze-b2';
import { SubscriptionStatus } from '@prisma/client';
import { Client } from '@notionhq/client';
import { AuthenticatedRequest, User } from './types/auth';

dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const app = express();
const port = parseInt(process.env.PORT || '5000');

// Define allowed origins globally
const allowedOrigins = [
  'http://localhost:5173',
  'https://crosspodium.web.app'
];

// Verify database connection
async function verifyDatabaseConnection(): Promise<boolean> {
  const maxRetries = 5;
  const retryDelay = 5000; // 5 seconds
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log(`Attempting to connect to database (attempt ${retries + 1}/${maxRetries})...`);
      console.log(`Database URL: ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@')}`);
      
      await prisma.$connect();
      console.log('✅ Database connection successful');
      
      // Test query to verify full connectivity
      const testQuery = await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database query successful');
      
      return true;
    } catch (error) {
      retries++;
      console.error(`❌ Database connection attempt ${retries} failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof Error ? (error as any).code : undefined,
        meta: error instanceof Error ? (error as any).meta : undefined,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      if (retries < maxRetries) {
        console.log(`Retrying in ${retryDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  console.error('❌ Failed to connect to database after maximum retries');
  process.exit(1);
  return false;
}

// Database connection middleware
const checkDatabaseConnection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!await verifyDatabaseConnection()) {
    res.status(503).json({ error: 'Database connection failed' });
    return;
  }
  next();
};

app.use(checkDatabaseConnection);

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Retry-Count'
  ],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication middleware
const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
    }

    try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true }
      });

      if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
      }

    (req as AuthenticatedRequest).user = user;
      next();
    } catch (error) {
    console.error('Token verification error:', error);
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Mount routes
app.use('/api/integrations', integrationsRouter);
app.use('/api/media', mediaRoutes);

// Health check endpoint
app.get('/', async (_req: Request, res: Response) => {
  const dbConnected = await verifyDatabaseConnection();
    res.json({
    status: dbConnected ? 'ok' : 'database_error', 
    message: 'Server is running',
    port,
    env: process.env.NODE_ENV,
    database: dbConnected ? 'connected' : 'disconnected',
    databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@')
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server
async function startServer(port: number): Promise<boolean> {
  try {
    await verifyDatabaseConnection();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
    return true;
  } catch (error) {
    console.error('Failed to start server:', error);
    return false;
  }
}

// Initialize server
(async () => {
  try {
    const success = await startServer(port);
    if (!success) {
      process.exit(1);
    }

    // Add graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      app.listen(port).close(async () => {
        console.log('HTTP server closed');
        await prisma.$disconnect();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();