import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { pool } from '../config/database';
import { logger } from '../config/logger';
import { logAudit } from '../utils/auditLog';
import { rotateSecret, revertSecret } from '../services/secretsService';

type ManagedSecretKey = 'JWT_SECRET' | 'JWT_REFRESH_SECRET';
const MANAGED_KEYS: ManagedSecretKey[] = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];

// Apps that use JWT_SECRET and need manual .env update after rotation
const AFFECTED_APPS = ['PriceLab', 'AmzSellMetrics', 'StockPulse', 'SwiftStock', 'ManuMaestro', 'DataBridge'];

// Auth/role kontrolu route middleware (requireSsoAdmin) tarafindan yapilir.

export class SecretsController {
  // GET /api/admin/secrets — list metadata only (no values)
  static async listSecrets(_req: AuthRequest, res: Response) {
    try {
      const result = await pool.query<{
        id: string;
        secret_key: string;
        version: number;
        rotated_at: string | null;
        rotated_by: string | null;
        has_previous: boolean;
        rotated_by_name: string | null;
      }>(`
        SELECT
          s.id,
          s.secret_key,
          s.version,
          s.rotated_at,
          s.rotated_by,
          (s.previous_value != '') AS has_previous,
          u.name AS rotated_by_name
        FROM system_secrets s
        LEFT JOIN users u ON s.rotated_by = u.user_id
        WHERE s.secret_key = ANY($1)
        ORDER BY s.secret_key
      `, [MANAGED_KEYS]);

      res.json({ success: true, data: result.rows });
    } catch (err: unknown) {
      logger.error('List secrets error:', err);
      res.status(500).json({ error: 'Failed to fetch secrets' });
    }
  }

  // POST /api/admin/secrets/:key/rotate — generate new secret, save encrypted, update cache
  static async rotateSecret(req: AuthRequest, res: Response) {
    const { key } = req.params;
    if (!MANAGED_KEYS.includes(key as ManagedSecretKey)) {
      return res.status(400).json({ error: `Invalid secret key. Allowed: ${MANAGED_KEYS.join(', ')}` });
    }

    if (!process.env.SECRET_ENCRYPTION_KEY) {
      return res.status(503).json({
        error: 'Secret rotation unavailable',
        message: 'SECRET_ENCRYPTION_KEY is not configured on this server.',
      });
    }

    try {
      const { newValue, version } = await rotateSecret(key as ManagedSecretKey, req.user!.sub);

      await logAudit(req.user!.sub, 'SECRET_ROTATED', { secretKey: key, newVersion: version }, req.ip || 'unknown', req.headers['user-agent'] || '');

      logger.info(`Admin ${req.user!.email} rotated secret "${key}" to v${version}`);

      res.json({
        success: true,
        data: {
          secret_key: key,
          version,
          rotated_at: new Date().toISOString(),
          new_value: newValue,
          affected_apps: AFFECTED_APPS,
          warning: 'All active user sessions have been invalidated. Other applications must update their .env files with the new value.',
        },
      });
    } catch (err: unknown) {
      logger.error('Rotate secret error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to rotate secret', message });
    }
  }

  // POST /api/admin/secrets/:key/revert — revert to previous version
  static async revertSecret(req: AuthRequest, res: Response) {
    const { key } = req.params;
    if (!MANAGED_KEYS.includes(key as ManagedSecretKey)) {
      return res.status(400).json({ error: `Invalid secret key. Allowed: ${MANAGED_KEYS.join(', ')}` });
    }

    if (!process.env.SECRET_ENCRYPTION_KEY) {
      return res.status(503).json({ error: 'SECRET_ENCRYPTION_KEY is not configured' });
    }

    try {
      const { version } = await revertSecret(key as ManagedSecretKey, req.user!.sub);

      await logAudit(req.user!.sub, 'SECRET_REVERTED', { secretKey: key, newVersion: version }, req.ip || 'unknown', req.headers['user-agent'] || '');

      res.json({
        success: true,
        data: {
          secret_key: key,
          version,
          reverted_at: new Date().toISOString(),
          warning: 'All active sessions invalidated. Update other apps .env with the reverted value if needed.',
        },
      });
    } catch (err: unknown) {
      logger.error('Revert secret error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to revert secret', message });
    }
  }
}
