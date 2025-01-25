import express from 'express';
import usageRoutes from './routes/usage';
import subscriptionRoutes from './routes/subscription';
import trialRoutes from './routes/trial';
import { startRolloverCron } from './cron/monthlyRollover';

const app = express();

// Add middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add routes
app.use('/api/usage', usageRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/subscription/trial', trialRoutes);

// Start cron jobs
startRolloverCron();

export default app; 