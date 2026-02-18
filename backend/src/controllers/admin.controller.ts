import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { pool } from '../config/database';
import { logger } from '../config/logger';
import { logAudit } from '../utils/auditLog';

// UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Basic email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

function isAdmin(req: AuthRequest): boolean {
  return !!req.user?.apps && Object.values(req.user.apps).includes('admin');
}

export class AdminController {
  // GET /api/admin/users - Get all users
  static async getUsers(req: AuthRequest, res: Response) {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const result = await pool.query(`
        SELECT
          u.user_id,
          u.email,
          u.name,
          u.profile_picture,
          u.is_active,
          u.created_at,
          u.last_login_at as last_login,
          COALESCE(
            json_agg(
              json_build_object(
                'app_id', a.app_id,
                'app_code', a.app_code,
                'app_name', a.app_name,
                'role_code', r.role_code,
                'role_name', r.role_name
              )
            ) FILTER (WHERE a.app_id IS NOT NULL),
            '[]'
          ) as apps
        FROM users u
        LEFT JOIN user_app_roles uar ON u.user_id = uar.user_id
        LEFT JOIN applications a ON uar.app_id = a.app_id
        LEFT JOIN roles r ON uar.role_id = r.role_id
        GROUP BY u.user_id
        ORDER BY u.created_at DESC
      `);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error: unknown) {
      logger.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  // PATCH /api/admin/users/:userId/status - Toggle user active status
  static async toggleUserStatus(req: AuthRequest, res: Response) {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { userId } = req.params;
      if (!isValidUUID(userId)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      const { is_active } = req.body;
      if (typeof is_active !== 'boolean') {
        return res.status(400).json({ error: 'is_active must be a boolean' });
      }

      await pool.query(
        'UPDATE users SET is_active = $1 WHERE user_id = $2',
        [is_active, userId]
      );

      logger.info(`User ${userId} status changed to ${is_active} by ${req.user!.email}`);
      await logAudit(req.user!.sub, 'USER_STATUS_CHANGE', { targetUserId: userId, is_active }, req.ip || 'unknown');

      res.json({
        success: true,
        message: `User ${is_active ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error: unknown) {
      logger.error('Toggle user status error:', error);
      res.status(500).json({ error: 'Failed to update user status' });
    }
  }

  // POST /api/admin/users/:userId/apps - Assign app role to user
  static async assignAppRole(req: AuthRequest, res: Response) {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { userId } = req.params;
      const { app_id, role_id } = req.body;

      if (!isValidUUID(userId) || !isValidUUID(app_id) || !isValidUUID(role_id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      // Check if assignment already exists
      const existing = await pool.query(
        'SELECT * FROM user_app_roles WHERE user_id = $1 AND app_id = $2',
        [userId, app_id]
      );

      if (existing.rows.length > 0) {
        await pool.query(
          'UPDATE user_app_roles SET role_id = $1 WHERE user_id = $2 AND app_id = $3',
          [role_id, userId, app_id]
        );
      } else {
        await pool.query(
          'INSERT INTO user_app_roles (user_id, app_id, role_id) VALUES ($1, $2, $3)',
          [userId, app_id, role_id]
        );
      }

      logger.info(`App role assigned: user=${userId}, app=${app_id}, role=${role_id} by ${req.user!.email}`);
      await logAudit(req.user!.sub, 'ROLE_ASSIGNMENT', { targetUserId: userId, appId: app_id, roleId: role_id }, req.ip || 'unknown');

      res.json({
        success: true,
        message: 'App role assigned successfully'
      });
    } catch (error: unknown) {
      logger.error('Assign app role error:', error);
      res.status(500).json({ error: 'Failed to assign app role' });
    }
  }

  // DELETE /api/admin/users/:userId/apps/:appId - Remove app access
  static async removeAppAccess(req: AuthRequest, res: Response) {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { userId, appId } = req.params;

      if (!isValidUUID(userId) || !isValidUUID(appId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      await pool.query(
        'DELETE FROM user_app_roles WHERE user_id = $1 AND app_id = $2',
        [userId, appId]
      );

      logger.info(`App access removed: user=${userId}, app=${appId} by ${req.user!.email}`);
      await logAudit(req.user!.sub, 'ROLE_REMOVAL', { targetUserId: userId, appId }, req.ip || 'unknown');

      res.json({
        success: true,
        message: 'App access removed successfully'
      });
    } catch (error: unknown) {
      logger.error('Remove app access error:', error);
      res.status(500).json({ error: 'Failed to remove app access' });
    }
  }

  // GET /api/admin/applications - Get all applications
  static async getApplications(req: AuthRequest, res: Response) {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const result = await pool.query(`
        SELECT
          a.app_id,
          a.app_code,
          a.app_name,
          a.app_description,
          a.app_url,
          a.is_active,
          COUNT(uar.user_id) as user_count
        FROM applications a
        LEFT JOIN user_app_roles uar ON a.app_id = uar.app_id
        GROUP BY a.app_id
        ORDER BY a.app_name
      `);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error: unknown) {
      logger.error('Get applications error:', error);
      res.status(500).json({ error: 'Failed to fetch applications' });
    }
  }

  // GET /api/admin/roles - Get all roles
  static async getRoles(req: AuthRequest, res: Response) {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const result = await pool.query('SELECT * FROM roles ORDER BY role_name');

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error: unknown) {
      logger.error('Get roles error:', error);
      res.status(500).json({ error: 'Failed to fetch roles' });
    }
  }

  // POST /api/admin/users - Create new user manually
  static async createUser(req: AuthRequest, res: Response) {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { email, name } = req.body;

      if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: 'Valid email is required' });
      }
      if (!name || typeof name !== 'string' || name.trim().length < 2 || name.length > 255) {
        return res.status(400).json({ error: 'Name must be between 2 and 255 characters' });
      }

      // Check if user already exists
      const existing = await pool.query(
        'SELECT user_id FROM users WHERE email = $1',
        [email.toLowerCase().trim()]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Create user
      const result = await pool.query(
        `INSERT INTO users (email, name, is_active)
         VALUES ($1, $2, true) RETURNING user_id, email, name, is_active, created_at`,
        [email.toLowerCase().trim(), name.trim()]
      );

      logger.info(`User created manually: ${email} by ${req.user!.email}`);
      await logAudit(req.user!.sub, 'USER_CREATED', { email, name: name.trim() }, req.ip || 'unknown');

      res.json({
        success: true,
        data: result.rows[0],
        message: 'User created successfully'
      });
    } catch (error: unknown) {
      logger.error('Create user error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
}
