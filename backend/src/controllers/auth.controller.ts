import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../config/logger';

export class AuthController {
  // POST /api/auth/google - Google OAuth login
  static async googleLogin(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ success: false, error: 'Google token is required' });
      }

      // Verify Google token
      const googleData = await AuthService.verifyGoogleToken(token);

      // Find or create user
      const user = await AuthService.findOrCreateUser(googleData);

      if (!user.is_active) {
        return res.status(403).json({ success: false, error: 'Account is inactive' });
      }

      // Get user's app permissions
      const { apps, details } = await AuthService.getUserApps(user.user_id);

      // Generate JWT tokens
      const { accessToken, refreshToken } = AuthService.generateTokens(user, apps);

      // Store tokens
      await AuthService.storeToken(user.user_id, accessToken, refreshToken);

      logger.info(`User logged in: ${user.email}`);

      res.json({
        success: true,
        data: {
          user: {
            id: user.user_id,
            email: user.email,
            name: user.name,
            picture: user.profile_picture,
            apps: apps,
          },
          accessToken,
          refreshToken,
          apps: details,
        },
      });
    } catch (error: any) {
      logger.error('Google login error:', error);
      res.status(500).json({ success: false, error: 'Authentication failed' });
    }
  }

  // POST /api/auth/verify - Verify JWT token (called by other apps)
  static async verifyToken(req: Request, res: Response) {
    try {
      const { token, app_code } = req.body;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ success: false, error: 'Token is required' });
      }

      if (app_code && typeof app_code !== 'string') {
        return res.status(400).json({ success: false, error: 'Invalid app_code' });
      }

      // Verify token signature + revocation check
      const payload = await AuthService.verifyTokenWithRevocationCheck(token);

      // Check if user has access to the requested app
      if (app_code && !payload.apps[app_code]) {
        return res.status(403).json({ success: false, error: 'No access to this application' });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
          },
          role: app_code ? payload.apps[app_code] : null,
          apps: payload.apps,
        },
      });
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: 'Token expired' });
      }
      res.status(401).json({ success: false, error: 'Invalid token' });
    }
  }

  // POST /api/auth/logout - Logout user
  static async logout(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      await AuthService.revokeToken(req.user.sub);

      logger.info(`User logged out: ${req.user.email}`);

      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
      logger.error('Logout error:', error);
      res.status(500).json({ success: false, error: 'Logout failed' });
    }
  }

  // GET /api/auth/me - Get current user info
  static async me(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: req.user.sub,
            email: req.user.email,
            name: req.user.name,
            picture: req.user.picture,
          },
          apps: req.user.apps,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to get user info' });
    }
  }

  // POST /api/auth/refresh-token - Refresh access token with latest permissions
  static async refreshToken(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      // Get fresh user data and permissions from database
      const { apps } = await AuthService.getUserApps(req.user.sub);

      // Generate new tokens with updated permissions
      const { accessToken, refreshToken } = AuthService.generateTokens(
        {
          user_id: req.user.sub,
          email: req.user.email,
          name: req.user.name,
          profile_picture: req.user.picture,
        } as any,
        apps
      );

      // Store new tokens
      await AuthService.storeToken(req.user.sub, accessToken, refreshToken);

      logger.info(`Token refreshed for user: ${req.user.email}`);

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          apps,
        },
      });
    } catch (error: any) {
      logger.error('Token refresh error:', error);
      res.status(500).json({ success: false, error: 'Token refresh failed' });
    }
  }
}
