-- Migration 003: System Secrets Table
-- Purpose: Store encrypted JWT secrets for web-based rotation via Admin Console
-- Run: psql -U <user> -d apps_db -f 003_system_secrets.sql

CREATE TABLE IF NOT EXISTS system_secrets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_key    VARCHAR(100) UNIQUE NOT NULL,
  secret_value  TEXT NOT NULL DEFAULT '',    -- AES-256-GCM encrypted (hex), empty = use env
  iv            VARCHAR(64) NOT NULL DEFAULT '',
  auth_tag      VARCHAR(64) NOT NULL DEFAULT '',
  version       INTEGER NOT NULL DEFAULT 1,
  previous_value TEXT NOT NULL DEFAULT '',   -- encrypted previous value for revert
  previous_iv    VARCHAR(64) NOT NULL DEFAULT '',
  previous_auth_tag VARCHAR(64) NOT NULL DEFAULT '',
  rotated_at    TIMESTAMPTZ,
  rotated_by    UUID REFERENCES users(user_id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert managed secret keys (values start empty → falls back to .env on first run)
INSERT INTO system_secrets (secret_key)
VALUES
  ('JWT_SECRET'),
  ('JWT_REFRESH_SECRET')
ON CONFLICT (secret_key) DO NOTHING;
