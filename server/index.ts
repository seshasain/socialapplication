import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import integrationsRouter from './routes/integrations';
import googleAuthRouter from './routes/auth/google';
import usageRoutes from './routes/usage';
import subscriptionRoutes from './routes/subscription';
import trialRoutes from './routes/trial';
import { startRolloverCron } from './cron/monthlyRollover';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/integrations', integrationsRouter);
app.use('/api', googleAuthRouter);
app.use('/api/usage', usageRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/subscription/trial', trialRoutes);

// Start cron jobs
startRolloverCron();

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await prisma.$connect();
    console.log('Connected to database');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 