import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const validateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers['x-api-key'] as string;

  if (process.env.REQUIRE_API_KEY === 'true') {
    if (!apiKey) {
      logger.warn('Missing API key in request');
      res.status(401).json({
        success: false,
        message: 'API key required',
      });
      return;
    }

    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
    
    if (!validApiKeys.includes(apiKey)) {
      logger.warn('Invalid API key attempted', { apiKey });
      res.status(401).json({
        success: false,
        message: 'Invalid API key',
      });
      return;
    }
  }

  next();
};
