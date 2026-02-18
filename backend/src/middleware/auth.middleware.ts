import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { TokenPayload } from '../types';
import { logger } from '../config/logger';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const payload = await AuthService.verifyTokenWithRevocationCheck(token);

    req.user = payload;
    next();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    const name = error instanceof Error ? error.name : '';
    logger.error(`Auth error for ${req.path}:`, msg);
    if (name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (msg === 'Token has been revoked' || msg === 'Token has been superseded') {
      return res.status(401).json({ error: 'Token has been revoked' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasRole = Object.values(req.user.apps).some(role => allowedRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
