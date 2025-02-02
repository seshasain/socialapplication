import { Request, Response, NextFunction } from 'express';

export const validateSourceConfig = (req: Request, res: Response, next: NextFunction): void => {
  const { config } = req.body;
  
  if (!config) {
    res.status(400).json({ error: 'Source configuration is required' });
    return;
  }

  if (config.wordpress) {
    if (!config.wordpress.siteUrl) {
      res.status(400).json({ error: 'WordPress site URL is required' });
      return;
    }
    if (!config.wordpress.postTypes || !Array.isArray(config.wordpress.postTypes)) {
      res.status(400).json({ error: 'WordPress post types must be an array' });
      return;
    }
  }

  next();
}; 