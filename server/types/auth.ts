import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  role: string;
}

// For routes that require authentication, user will always be present
export interface AuthenticatedRequest extends Request {
  user: User;  // Note: Not optional here since these are for authenticated routes
}

// For the global Express namespace, keep it optional since not all routes require auth
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
} 