import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface CustomHandler {
      (req: Request, res: Response, next: NextFunction): Promise<void> | void;
    }
  }
}

declare module 'express-async-handler' {
  function asyncHandler(handler: Express.CustomHandler): Express.RequestHandler;
  export = asyncHandler;
} 