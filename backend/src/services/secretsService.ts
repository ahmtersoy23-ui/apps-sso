import { randomBytes } from 'crypto';
import { pool } from '../config/database';
import { logger } from '../config/logger';
import { encrypt, decrypt } from '../utils/encryption';

type SecretKey = 'JWT_SECRET' | 'JWT_REFRESH_SECRET';

// In-memory cache: populated at startup and on rotation
const secretCache = new Map<SecretKey, string>();

function getMasterKey(): string {
  const key = process.env.SECRET_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error('SECRET_ENCRYPTION_KEY must be set to a 64-character hex string');
  }
  return key;
}

/**
 * Load all secrets from DB into in-memory cache.
 * Called once at application startup (after DB connection).
 * Secrets with empty value fall back to environment variables.
 */
export async function loadSecrets(): Promise<void> {
  // If encryption key is not configured, skip DB loading (use env only)
  if (!process.env.SECRET_ENCRYPTION_KEY) {
    logger.warn('SECRET_ENCRYPTION_KEY not set — secrets loaded from environment variables only');
    return;
  }

  try {
    const result = await pool.query<{
      secret_key: SecretKey;
      secret_value: string;
      iv: string;
      auth_tag: string;
    }>('SELECT secret_key, secret_value, iv, auth_tag FROM system_secrets');

    let loadedFromDb = 0;
    for (const row of result.rows) {
      if (row.secret_value && row.iv && row.auth_tag) {
        try {
          const plaintext = decrypt(
            { encrypted: row.secret_value, iv: row.iv, authTag: row.auth_tag },
            getMasterKey()
          );
          secretCache.set(row.secret_key, plaintext);
          loadedFromDb++;
        } catch (err: unknown) {
          logger.error(`Failed to decrypt secret "${row.secret_key}" from DB:`, err);
        }
      }
    }

    if (loadedFromDb > 0) {
      logger.info(`✅ Loaded ${loadedFromDb} secret(s) from DB (supersedes .env values)`);
    } else {
      logger.info('No DB secrets found — using environment variables');
    }
  } catch (err: unknown) {
    logger.warn('Could not load secrets from DB (table may not exist yet):', err);
    logger.warn('Falling back to environment variables for JWT secrets');
  }
}

/**
 * Get a secret value. Priority: in-memory cache (from DB) → process.env.
 */
export function getSecret(key: SecretKey): string {
  const cached = secretCache.get(key);
  if (cached) return cached;
  return process.env[key] || '';
}

/**
 * Rotate a secret: generate new value, persist to DB (encrypted), update cache.
 * Returns the new plaintext value (shown ONCE to the admin).
 */
export async function rotateSecret(
  key: SecretKey,
  rotatedByUserId: string
): Promise<{ newValue: string; version: number }> {
  const masterKey = getMasterKey();

  // Generate new 64-char hex secret (32 bytes)
  const newValue = randomBytes(32).toString('hex');
  const encrypted = encrypt(newValue, masterKey);

  // Get current value to save as previous (for revert)
  const current = await pool.query<{
    secret_value: string;
    iv: string;
    auth_tag: string;
    version: number;
  }>('SELECT secret_value, iv, auth_tag, version FROM system_secrets WHERE secret_key = $1', [key]);

  if (current.rows.length === 0) {
    throw new Error(`Secret key "${key}" not found in system_secrets table`);
  }

  const currentRow = current.rows[0];
  const newVersion = currentRow.version + 1;

  await pool.query(
    `UPDATE system_secrets
     SET secret_value = $1, iv = $2, auth_tag = $3,
         version = $4,
         previous_value = $5, previous_iv = $6, previous_auth_tag = $7,
         rotated_at = NOW(), rotated_by = $8
     WHERE secret_key = $9`,
    [
      encrypted.encrypted, encrypted.iv, encrypted.authTag,
      newVersion,
      currentRow.secret_value, currentRow.iv, currentRow.auth_tag,
      rotatedByUserId,
      key,
    ]
  );

  // Update in-memory cache
  secretCache.set(key, newValue);
  logger.info(`Secret "${key}" rotated to version ${newVersion} by user ${rotatedByUserId}`);

  return { newValue, version: newVersion };
}

/**
 * Revert a secret to the previous version.
 * Swaps current ↔ previous in DB and updates cache.
 */
export async function revertSecret(
  key: SecretKey,
  revertedByUserId: string
): Promise<{ version: number }> {
  const masterKey = getMasterKey();

  const current = await pool.query<{
    secret_value: string; iv: string; auth_tag: string;
    previous_value: string; previous_iv: string; previous_auth_tag: string;
    version: number;
  }>('SELECT * FROM system_secrets WHERE secret_key = $1', [key]);

  if (current.rows.length === 0) throw new Error(`Secret key "${key}" not found`);

  const row = current.rows[0];
  if (!row.previous_value) throw new Error(`No previous version available for "${key}"`);

  // Swap current ↔ previous
  const newVersion = row.version + 1;
  await pool.query(
    `UPDATE system_secrets
     SET secret_value = $1, iv = $2, auth_tag = $3,
         version = $4,
         previous_value = $5, previous_iv = $6, previous_auth_tag = $7,
         rotated_at = NOW(), rotated_by = $8
     WHERE secret_key = $9`,
    [
      row.previous_value, row.previous_iv, row.previous_auth_tag,
      newVersion,
      row.secret_value, row.iv, row.auth_tag,
      revertedByUserId,
      key,
    ]
  );

  // Update cache
  try {
    const previousPlain = decrypt(
      { encrypted: row.previous_value, iv: row.previous_iv, authTag: row.previous_auth_tag },
      masterKey
    );
    secretCache.set(key, previousPlain);
  } catch (err: unknown) {
    logger.error(`Failed to decrypt reverted secret "${key}":`, err);
  }

  logger.info(`Secret "${key}" reverted to version ${newVersion} by user ${revertedByUserId}`);
  return { version: newVersion };
}
