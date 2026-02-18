import { z } from 'zod';

// ============================================
// AUTH SCHEMAS
// ============================================

export const googleLoginSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
  clientId: z.string().optional(),
}).strict();

export const verifyTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  app_code: z.string().min(1, 'App code is required'),
}).strict();

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
}).strict();

// ============================================
// ADMIN - USER SCHEMAS
// ============================================

export const createUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string().min(1, 'Name is required').max(255),
  googleId: z.string().optional(),
  profilePicture: z.string().url().optional().nullable(),
}).strict();

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
}).strict();

// ============================================
// ADMIN - APP ROLE SCHEMAS
// ============================================

export const assignAppRoleSchema = z.object({
  appId: z.string().uuid('Invalid app ID'),
  roleId: z.string().uuid('Invalid role ID'),
}).strict();

export const removeAppRoleSchema = z.object({
  appId: z.string().uuid('Invalid app ID'),
}).strict();

// ============================================
// PARAM SCHEMAS
// ============================================

export const uuidParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
}).strict();

export const appCodeParamSchema = z.object({
  appCode: z.string().min(1, 'Invalid app code'),
}).strict();
