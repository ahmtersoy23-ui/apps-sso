import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { TokenPayload } from '../types';
import { logger } from '../config/logger';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

// Geçici hardgate: migration 005 uygulanana kadar SSO admin olarak kabul edilen email'ler.
// Migration uygulandıktan sonra bu liste boşaltılabilir; isSsoAdmin RBAC ile çalışmaya devam eder.
const SUPER_ADMIN_EMAILS = new Set([
  'ersoy@iwaconcept.com.tr',
  'huseyin@iwaconcept.com.tr',
]);

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
    logger.error(`Auth error for ${req.path}: ${msg}`);
    if (name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (msg === 'Token has been revoked' || msg === 'Token has been superseded') {
      return res.status(401).json({ error: 'Token has been revoked' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * SSO admin paneline erişim kontrolü.
 * Önce RBAC: payload.apps['apps-sso'] === 'admin' (migration 005 sonrası birincil yol)
 * Sonra email hardgate: SUPER_ADMIN_EMAILS (migration uygulanmadan da çalışır)
 *
 * Eskiden `Object.values(req.user.apps).includes('admin')` kullanılıyordu — bu
 * herhangi bir app'in admin'ini SSO admin sayıyordu (privilege escalation, audit-apps-sso.md §1).
 */
export function isSsoAdmin(req: AuthRequest): boolean {
  if (!req.user) return false;
  if (req.user.apps?.['apps-sso'] === 'admin') return true;
  return SUPER_ADMIN_EMAILS.has(req.user.email);
}

export const requireSsoAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!isSsoAdmin(req)) {
    return res.status(403).json({ error: 'SSO admin access required' });
  }
  next();
};

/**
 * @deprecated Cross-app rol kontrolü güvensiz (privilege escalation riski).
 * Apps-SSO admin route'ları için `requireSsoAdmin` kullanın. Belirli bir uygulamanın
 * rolünü kontrol etmek gerekiyorsa appCode parametresi geçin.
 */
export const requireRole = (allowedRoles: string[], appCode?: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasRole = appCode
      ? allowedRoles.includes(req.user.apps?.[appCode] ?? '')
      : Object.values(req.user.apps).some(role => allowedRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
