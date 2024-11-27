import express from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';


const router = express.Router();
const prisma = new PrismaClient();

// Initialize B2 client

export default router;