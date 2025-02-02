import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
        email: string;
        role: string;
      };

      prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true }
      })
        .then(user => {
          if (!user) {
            res.status(401).json({ error: 'User not found' });
            resolve();
            return;
          }
          req.user = user;
          next();
          resolve();
        })
        .catch(error => {
          console.error('Authentication error:', error);
          res.status(401).json({ error: 'Invalid authentication token' });
          resolve();
        });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ error: 'Invalid authentication token' });
      resolve();
    }
  });
}; 