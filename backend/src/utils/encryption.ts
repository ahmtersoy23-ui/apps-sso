import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export interface EncryptedData {
  encrypted: string;  // hex
  iv: string;         // hex, 16 bytes
  authTag: string;    // hex, 16 bytes
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * masterKey must be a 64-char hex string (32 bytes).
 */
export function encrypt(text: string, masterKey: string): EncryptedData {
  const key = Buffer.from(masterKey, 'hex');
  if (key.length !== 32) {
    throw new Error('SECRET_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return {
    encrypted: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
  };
}

/**
 * Decrypt ciphertext using AES-256-GCM.
 * masterKey must be a 64-char hex string (32 bytes).
 */
export function decrypt(data: EncryptedData, masterKey: string): string {
  const key = Buffer.from(masterKey, 'hex');
  if (key.length !== 32) {
    throw new Error('SECRET_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(data.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(data.encrypted, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}
