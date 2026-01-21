import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { TokenPayload } from '../types';
import { logger } from '../config/logger';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    logger.info(`Auth middleware: ${req.method} ${req.path}`);
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn(`No auth header for ${req.path}`);
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const payload = AuthService.verifyToken(token);

    logger.info(`Token verified for user: ${payload.email}`);
    req.user = payload;
    next();
  } catch (error: any) {
    logger.error(`Auth error for ${req.path}:`, error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has admin role in any app
    const hasRole = Object.values(req.user.apps).some(role => allowedRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
