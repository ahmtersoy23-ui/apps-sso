import { Router } from 'express';
import { FundmateController } from '../controllers/fundmate.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate';
import { fundmateHistorySchema } from '../validation/schemas';

const router = Router();

router.use(authenticate);

router.post('/history', validateBody(fundmateHistorySchema), FundmateController.saveHistory);
router.get('/history', FundmateController.getHistory);
router.delete('/history/:id', FundmateController.deleteHistory);

export default router;
