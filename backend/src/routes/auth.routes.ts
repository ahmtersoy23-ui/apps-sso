import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate';
import {
  googleLoginSchema,
  verifyTokenSchema,
  refreshTokenSchema,
} from '../validation/schemas';

const router = Router();

// Public routes
router.post('/google', validateBody(googleLoginSchema), AuthController.googleLogin);
router.post('/verify', validateBody(verifyTokenSchema), AuthController.verifyToken);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.me);
router.post('/refresh-token', authenticate, validateBody(refreshTokenSchema), AuthController.refreshToken);

export default router;
