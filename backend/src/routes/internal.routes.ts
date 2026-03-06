import { Router, Request, Response, NextFunction } from 'express';
import { getSecret } from '../services/secretsService';

const router = Router();

// Internal API key authentication middleware
// This endpoint is protected by nginx (allow 127.0.0.1; deny all)
// plus INTERNAL_API_KEY as a second layer of defence
router.use((req: Request, res: Response, next: NextFunction): void => {
  const configuredKey = process.env.INTERNAL_API_KEY;
  const providedKey = req.headers['x-internal-api-key'];

  if (!configuredKey || providedKey !== configuredKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
});

// GET /api/internal/jwt-secret
// Used by SwiftStock to stay in sync with Apps-SSO's active JWT_SECRET.
// Response is intentionally minimal: only the secret value, no metadata.
router.get('/jwt-secret', (_req: Request, res: Response): void => {
  const secret = getSecret('JWT_SECRET');

  if (!secret) {
    res.status(503).json({ error: 'JWT_SECRET not available' });
    return;
  }

  res.json({ secret });
});

export default router;
