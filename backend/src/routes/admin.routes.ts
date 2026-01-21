import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// Users management
router.get('/users', AdminController.getUsers);
router.post('/users', AdminController.createUser);
router.patch('/users/:userId/status', AdminController.toggleUserStatus);
router.post('/users/:userId/apps', AdminController.assignAppRole);
router.delete('/users/:userId/apps/:appId', AdminController.removeAppAccess);

// Applications management
router.get('/applications', AdminController.getApplications);

// Roles
router.get('/roles', AdminController.getRoles);

export default router;
