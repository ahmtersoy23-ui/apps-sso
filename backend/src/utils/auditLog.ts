import { pool } from '../config/database';
import { logger } from '../config/logger';

function parseDeviceInfo(ua: string): { device_type: string; browser: string; os: string } {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  const device_type = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  let browser = 'unknown';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\//i.test(ua)) browser = 'Opera';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';

  let os = 'unknown';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Mac OS/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return { device_type, browser, os };
}

export async function logAudit(
  userId: string,
  action: string,
  details: Record<string, unknown>,
  ipAddress: string,
  userAgent?: string
): Promise<void> {
  try {
    const metadata = { ...details };
    if (userAgent) {
      const deviceInfo = parseDeviceInfo(userAgent);
      metadata.device_type = deviceInfo.device_type;
      metadata.browser = deviceInfo.browser;
      metadata.os = deviceInfo.os;
    }

    await pool.query(
      'INSERT INTO audit_logs (user_id, action, metadata, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
      [userId, action, JSON.stringify(metadata), ipAddress, userAgent || null]
    );
  } catch (err) {
    logger.error('Failed to write audit log:', err);
  }
}
