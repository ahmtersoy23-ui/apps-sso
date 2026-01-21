import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../config/logger';

export class AuthController {
  // POST /api/auth/google - Google OAuth login
  static async googleLogin(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Google token is required' });
      }

      // Verify Google token
      const googleData = await AuthService.verifyGoogleToken(token);

      // Find or create user
      const user = await AuthService.findOrCreateUser(googleData);

      if (!user.is_active) {
        return res.status(403).json({ error: 'Account is inactive' });
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
            apps: apps, // Add apps object to user for frontend admin check
          },
          accessToken,
          refreshToken,
          apps: details,
        },
      });
    } catch (error: any) {
      logger.error('Google login error:', error);
      res.status(500).json({ error: 'Authentication failed', message: error.message });
    }
  }

  // POST /api/auth/verify - Verify JWT token
  static async verifyToken(req: Request, res: Response) {
    try {
      const { token, app_code } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      const payload = AuthService.verifyToken(token);

      // Check if user has access to the requested app
      if (app_code && !payload.apps[app_code]) {
        return res.status(403).json({ error: 'No access to this application' });
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
      res.status(401).json({ error: 'Invalid token', message: error.message });
    }
  }

  // POST /api/auth/logout - Logout user
  static async logout(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      await AuthService.revokeToken(req.user.sub);

      logger.info(`User logged out: ${req.user.email}`);

      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
      logger.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed', message: error.message });
    }
  }

  // GET /api/auth/me - Get current user info
  static async me(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
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
      res.status(500).json({ error: 'Failed to get user info', message: error.message });
    }
  }
}
