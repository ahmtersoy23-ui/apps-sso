import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { query } from '../config/database';
import { redisClient } from '../config/redis';
import { TokenPayload, User } from '../types';

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET environment variables are required');
  process.exit(1);
}

const JWT_SECRET: string = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET;

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService {
  // Verify Google OAuth token
  static async verifyGoogleToken(token: string) {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new Error('Invalid Google token');

    return {
      google_id: payload.sub,
      email: payload.email!,
      name: payload.name!,
      picture: payload.picture,
      email_verified: payload.email_verified || false,
    };
  }

  // Find or create user from Google OAuth
  static async findOrCreateUser(googleData: any): Promise<User> {
    // Check if user exists
    let result = await query(
      'SELECT * FROM users WHERE google_id = $1 OR email = $2',
      [googleData.google_id, googleData.email]
    );

    if (result.rows.length > 0) {
      // Update last login
      const user = result.rows[0];
      await query(
        'UPDATE users SET last_login_at = NOW(), profile_picture = $1 WHERE user_id = $2',
        [googleData.picture, user.user_id]
      );
      return user;
    }

    // Create new user
    result = await query(
      `INSERT INTO users (email, name, google_id, profile_picture, is_email_verified)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [googleData.email, googleData.name, googleData.google_id, googleData.picture, googleData.email_verified]
    );

    return result.rows[0];
  }

  // Get user's app permissions
  static async getUserApps(userId: string) {
    const result = await query(
      `SELECT
        a.app_code,
        a.app_name,
        a.app_url,
        a.app_icon,
        r.role_code,
        r.role_name
       FROM user_app_roles uar
       JOIN applications a ON uar.app_id = a.app_id
       JOIN roles r ON uar.role_id = r.role_id
       WHERE uar.user_id = $1 AND a.is_active = true`,
      [userId]
    );

    const apps: Record<string, string> = {};
    result.rows.forEach(row => {
      apps[row.app_code] = row.role_code;
    });

    return { apps, details: result.rows };
  }

  // Generate JWT tokens
  static generateTokens(user: User, apps: Record<string, string>) {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      sub: user.user_id,
      email: user.email,
      name: user.name,
      picture: user.profile_picture,
      apps,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
    const refreshToken = jwt.sign({ sub: user.user_id }, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }

  // Store token in Redis
  static async storeToken(userId: string, accessToken: string, refreshToken: string) {
    const tokenKey = `token:${userId}`;
    await redisClient.setEx(tokenKey, 7 * 24 * 60 * 60, JSON.stringify({ accessToken, refreshToken }));

    // Also store in database for audit
    await query(
      `INSERT INTO auth_tokens (user_id, access_token, refresh_token, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
      [userId, accessToken, refreshToken]
    );
  }

  // Verify JWT token
  static verifyToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }

  // Revoke token
  static async revokeToken(userId: string) {
    await redisClient.del(`token:${userId}`);
    await query('UPDATE auth_tokens SET is_revoked = true WHERE user_id = $1', [userId]);
  }
}
