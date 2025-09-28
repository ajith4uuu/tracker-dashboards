import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = authService.verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
      return;
    }

    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      res.status(401).json({
        success: false,
        message: 'Token expired',
      });
      return;
    }

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp,
    };

    return next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
    }) as any;
  }
};

export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = authService.verifyToken(token);
      
      if (decoded && (!decoded.exp || decoded.exp * 1000 >= Date.now())) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          iat: decoded.iat,
          exp: decoded.exp,
        };
      }
    }
    
    return next();
  } catch (error) {
    // Continue without authentication
    return next();
  }
};
