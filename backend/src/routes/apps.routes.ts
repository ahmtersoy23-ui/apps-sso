import { Router } from 'express';
import { query } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /api/apps - List all applications
router.get('/', authenticate, async (_req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT app_id, app_code, app_name, app_description, app_url, app_icon FROM applications WHERE is_active = true ORDER BY app_name'
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: 'Failed to fetch applications', message: 'Internal server error' });
  }
});

// GET /api/apps/my - Get user's applications with roles
router.get('/my', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await query(
      `SELECT
        a.app_id,
        a.app_code,
        a.app_name,
        a.app_description,
        a.app_url,
        a.app_icon,
        r.role_code,
        r.role_name,
        r.description as role_description
       FROM user_app_roles uar
       JOIN applications a ON uar.app_id = a.app_id
       JOIN roles r ON uar.role_id = r.role_id
       WHERE uar.user_id = $1 AND a.is_active = true
       ORDER BY a.app_name`,
      [req.user.sub]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: 'Failed to fetch user applications', message: 'Internal server error' });
  }
});

export default router;
