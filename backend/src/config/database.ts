import { Pool } from 'pg';
import dotenv from 'dotenv';
import { logger } from './logger';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'apps_db',
  user: process.env.DB_USER || 'apps_sso',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Pool 'error' event'i idle client'larda (transient network/PG restart vb.) tetiklenir.
// Eskiden process.exit(-1) cagriliyordu — tek transient error 8 app'i etkileyen SSO downtime'ina
// yol aciyordu. Pool kendi kendine recover eder; bir sonraki query yeni connection acar.
pool.on('error', (err) => {
  logger.error('Database pool idle client error (recoverable):', err.message);
});

export const query = async (text: string, params?: (string | number | boolean | null | object)[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // Only log slow queries in production; avoid logging full SQL text
  if (duration > 500) {
    logger.warn('Slow query', { duration, rows: res.rowCount });
  }
  return res;
};
