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
  is_active: z.boolean(),
}).strict();

// ============================================
// ADMIN - APP ROLE SCHEMAS
// ============================================

export const assignAppRoleSchema = z.object({
  app_id: z.string().uuid('Invalid app ID'),
  role_id: z.string().uuid('Invalid role ID'),
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

export const userAppParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  appId: z.string().uuid('Invalid app ID'),
}).strict();

export const appCodeParamSchema = z.object({
  appCode: z.string().min(1, 'Invalid app code'),
}).strict();

// ============================================
// FUNDMATE SCHEMAS
// ============================================

export const fundmateHistorySchema = z.object({
  company: z.string().max(255).optional(),
  country: z.string().min(1).max(5),
  month: z.string().min(1).max(20),
  year: z.number().int().min(2020).max(2035),
  currency: z.string().min(1).max(10),
  maxPct: z.number().min(0).max(100).optional(),
  supportPct: z.number().min(0).max(100).optional(),
  rate: z.number().min(0).optional(),
  totalSales: z.number().optional(),
  orderFees: z.number().optional(),
  refundFees: z.number().optional(),
  storageFees: z.number().optional(),
  totalFees: z.number().optional(),
  eligibleAmount: z.number().optional(),
  supportAmount: z.number().optional(),
  supportAmountTRY: z.number().optional(),
}).strict();
