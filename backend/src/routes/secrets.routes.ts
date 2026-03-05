import { Router } from 'express';
import { SecretsController } from '../controllers/secrets.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// All secrets routes require authentication + admin role
router.use(authenticate);
router.use(requireRole(['admin']));

router.get('/secrets', SecretsController.listSecrets);
router.post('/secrets/:key/rotate', SecretsController.rotateSecret);
router.post('/secrets/:key/revert', SecretsController.revertSecret);

export default router;
