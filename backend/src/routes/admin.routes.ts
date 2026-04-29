import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, requireSsoAdmin } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validate';
import {
  createUserSchema,
  updateUserStatusSchema,
  assignAppRoleSchema,
  uuidParamSchema,
  userAppParamSchema,
} from '../validation/schemas';

const router = Router();

// All admin routes require authentication + SSO admin role
router.use(authenticate);
router.use(requireSsoAdmin);

// Users management
router.get('/users', AdminController.getUsers);
router.post('/users', validateBody(createUserSchema), AdminController.createUser);
router.patch('/users/:userId/status', validateParams(uuidParamSchema), validateBody(updateUserStatusSchema), AdminController.toggleUserStatus);
router.delete('/users/:userId', validateParams(uuidParamSchema), AdminController.deleteUser);
router.post('/users/:userId/apps', validateParams(uuidParamSchema), validateBody(assignAppRoleSchema), AdminController.assignAppRole);
router.delete('/users/:userId/apps/:appId', validateParams(userAppParamSchema), AdminController.removeAppAccess);

// Applications management
router.get('/applications', AdminController.getApplications);

// Roles
router.get('/roles', AdminController.getRoles);

export default router;
