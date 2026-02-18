import { pool } from '../config/database';
import { logger } from '../config/logger';

export async function logAudit(
  userId: string,
  action: string,
  details: Record<string, unknown>,
  ipAddress: string
): Promise<void> {
  try {
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, metadata, ip_address) VALUES ($1, $2, $3, $4)',
      [userId, action, JSON.stringify(details), ipAddress]
    );
  } catch (err) {
    logger.error('Failed to write audit log:', err);
  }
}
