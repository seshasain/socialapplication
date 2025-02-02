import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import mediaRoutes from './routes/media.js';
import integrationsRoutes from './routes/integrations.js';
import userRoutes from './routes/user.js';
import { verifyB2Credentials } from './storage/b2.js';

dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const app = express();
const port = parseInt(process.env.PORT) || 5000;

// Define allowed origins globally
const allowedOrigins = [
  'http://localhost:5173',
  'https://crosspodium.web.app'
];

// Verify database connection
async function verifyDatabaseConnection() {
  const maxRetries = 3;  // Reduced from 5
  const retryDelay = 2000;  // Reduced from 5000
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log(`Attempting to connect to database (attempt ${retries + 1}/${maxRetries})...`);
      
      await prisma.$connect();
      console.log('✅ Database connection successful');
      
      return true;
    } catch (error) {
      retries++;
      console.error(`❌ Database connection attempt ${retries} failed:`, {
        error: error.message,
        code: error.code
      });
      
      if (retries < maxRetries) {
        console.log(`Retrying in ${retryDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  console.error('❌ Failed to connect to database after maximum retries');
  return false;  // Don't exit process, just return false
}

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Call verifyDatabaseConnection before starting the server
app.use(async (req, res, next) => {
  if (!await verifyDatabaseConnection()) {
    return res.status(503).json({ error: 'Database connection failed' });
  }
  next();
});

// Middleware for CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Retry-Count'
    );
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use('/api/integrations', integrationsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/media', mediaRoutes);

// Enhanced health check endpoint
app.get('/', async (req, res) => {
  const dbConnected = await verifyDatabaseConnection();
  res.json({ 
    status: dbConnected ? 'ok' : 'database_error', 
    message: 'Server is running',
    port: port,
    env: process.env.NODE_ENV,
    database: dbConnected ? 'connected' : 'disconnected',
    databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@') // Hide password
  });
});

// Start server first to meet Cloud Run requirements
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Initialize services after server is started
(async () => {
  try {
    // Verify database connection with retries
    const dbConnected = await verifyDatabaseConnection();
    if (!dbConnected) {
      console.error('⚠️ Server started but database connection failed');
    } else {
      console.log('✅ Database connection successful');
    }

    // Verify B2 credentials
    await verifyB2Credentials();
    console.log('✅ B2 credentials verified successfully');
  } catch (error) {
    console.error('⚠️ Service initialization error:', error);
  }
})();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
    process.exit(0);
  });
});

// Error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

export default app;