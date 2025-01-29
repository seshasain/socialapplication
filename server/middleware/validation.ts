import { Request, Response, NextFunction } from 'express';

export const validateSourceConfig = (req: Request, res: Response, next: NextFunction) => {
  const { config } = req.body;
  
  if (!config) {
    return res.status(400).json({ error: 'Source configuration is required' });
  }

  if (config.wordpress) {
    if (!config.wordpress.siteUrl) {
      return res.status(400).json({ error: 'WordPress site URL is required' });
    }
    if (!config.wordpress.postTypes || !Array.isArray(config.wordpress.postTypes)) {
      return res.status(400).json({ error: 'WordPress post types must be an array' });
    }
  }

  next();
}; 