import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { pool } from '../config/database';
import { logger } from '../config/logger';

function isAdmin(req: AuthRequest): boolean {
  return !!req.user?.apps && Object.values(req.user.apps).includes('admin');
}

function isFundmateUser(req: AuthRequest): boolean {
  return !!req.user?.apps && 'fundmate' in req.user.apps;
}

export class FundmateController {
  // POST /api/fundmate/history - Save analysis result
  static async saveHistory(req: AuthRequest, res: Response) {
    try {
      if (!isFundmateUser(req)) {
        return res.status(403).json({ success: false, error: 'No access to FundMate' });
      }

      const {
        company, country, month, year, currency,
        maxPct, supportPct, rate,
        totalSales, orderFees, refundFees, storageFees,
        totalFees, eligibleAmount, supportAmount, supportAmountTRY
      } = req.body;

      await pool.query(
        `INSERT INTO fundmate_analysis_history
          (user_id, company, country, month, year, currency,
           max_pct, support_pct, rate,
           total_sales, order_fees, refund_fees, storage_fees,
           total_fees, eligible_amount, support_amount, support_amount_try)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          req.user!.sub,
          company || '-', country, month, year, currency,
          maxPct || 20, supportPct || 50, rate || 1,
          totalSales || 0, orderFees || 0, refundFees || 0, storageFees || 0,
          totalFees || 0, eligibleAmount || 0, supportAmount || 0, supportAmountTRY || 0
        ]
      );

      logger.info(`FundMate analysis saved by ${req.user!.email} - ${company} ${country} ${month}/${year}`);
      res.json({ success: true, message: 'Analysis saved' });
    } catch (error: unknown) {
      logger.error('FundMate save error:', error);
      res.status(500).json({ success: false, error: 'Failed to save analysis' });
    }
  }

  // GET /api/fundmate/history - Get all history (admin only)
  static async getHistory(req: AuthRequest, res: Response) {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      const result = await pool.query(
        `SELECT h.*, u.name as user_name, u.email as user_email
         FROM fundmate_analysis_history h
         JOIN users u ON u.user_id = h.user_id
         ORDER BY h.created_at DESC
         LIMIT 500`
      );

      res.json({ success: true, data: result.rows });
    } catch (error: unknown) {
      logger.error('FundMate history error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch history' });
    }
  }

  // DELETE /api/fundmate/history/:id - Delete single entry (admin only)
  static async deleteHistory(req: AuthRequest, res: Response) {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      const { id } = req.params;
      await pool.query('DELETE FROM fundmate_analysis_history WHERE id = $1', [id]);

      res.json({ success: true, message: 'Entry deleted' });
    } catch (error: unknown) {
      logger.error('FundMate delete error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete entry' });
    }
  }
}
