import {
  googleLoginSchema,
  verifyTokenSchema,
  refreshTokenSchema,
  createUserSchema,
  updateUserStatusSchema,
  assignAppRoleSchema,
  removeAppRoleSchema,
  uuidParamSchema,
  appCodeParamSchema,
} from '../validation/schemas';

// ============================================
// googleLoginSchema
// ============================================
describe('googleLoginSchema', () => {
  it('should accept valid credential', () => {
    expect(googleLoginSchema.safeParse({ credential: 'abc123' }).success).toBe(true);
  });

  it('should accept credential with optional clientId', () => {
    expect(googleLoginSchema.safeParse({ credential: 'abc123', clientId: 'cid' }).success).toBe(true);
  });

  it('should reject empty credential', () => {
    expect(googleLoginSchema.safeParse({ credential: '' }).success).toBe(false);
  });

  it('should reject missing credential', () => {
    expect(googleLoginSchema.safeParse({}).success).toBe(false);
  });

  it('should reject extra fields (strict)', () => {
    expect(googleLoginSchema.safeParse({ credential: 'abc', extra: true }).success).toBe(false);
  });

  it('should reject non-string credential', () => {
    expect(googleLoginSchema.safeParse({ credential: 123 }).success).toBe(false);
  });
});

// ============================================
// verifyTokenSchema
// ============================================
describe('verifyTokenSchema', () => {
  it('should accept valid token and app_code', () => {
    expect(verifyTokenSchema.safeParse({ token: 'jwt.token.here', app_code: 'pricelab' }).success).toBe(true);
  });

  it('should reject missing token', () => {
    expect(verifyTokenSchema.safeParse({ app_code: 'pricelab' }).success).toBe(false);
  });

  it('should reject missing app_code', () => {
    expect(verifyTokenSchema.safeParse({ token: 'jwt.token.here' }).success).toBe(false);
  });

  it('should reject empty token', () => {
    expect(verifyTokenSchema.safeParse({ token: '', app_code: 'app' }).success).toBe(false);
  });

  it('should reject empty app_code', () => {
    expect(verifyTokenSchema.safeParse({ token: 'abc', app_code: '' }).success).toBe(false);
  });

  it('should reject extra fields (strict)', () => {
    expect(verifyTokenSchema.safeParse({ token: 'abc', app_code: 'app', extra: 1 }).success).toBe(false);
  });
});

// ============================================
// refreshTokenSchema
// ============================================
describe('refreshTokenSchema', () => {
  it('should accept valid refreshToken', () => {
    expect(refreshTokenSchema.safeParse({ refreshToken: 'refresh.token' }).success).toBe(true);
  });

  it('should reject missing refreshToken', () => {
    expect(refreshTokenSchema.safeParse({}).success).toBe(false);
  });

  it('should reject empty refreshToken', () => {
    expect(refreshTokenSchema.safeParse({ refreshToken: '' }).success).toBe(false);
  });

  it('should reject extra fields (strict)', () => {
    expect(refreshTokenSchema.safeParse({ refreshToken: 'abc', extra: true }).success).toBe(false);
  });
});

// ============================================
// createUserSchema
// ============================================
describe('createUserSchema', () => {
  it('should accept valid email and name', () => {
    expect(createUserSchema.safeParse({ email: 'test@example.com', name: 'Test User' }).success).toBe(true);
  });

  it('should accept with optional fields', () => {
    const input = {
      email: 'test@example.com',
      name: 'Test',
      googleId: 'g123',
      profilePicture: 'https://example.com/pic.jpg',
    };
    expect(createUserSchema.safeParse(input).success).toBe(true);
  });

  it('should accept null profilePicture', () => {
    expect(createUserSchema.safeParse({ email: 'a@b.com', name: 'A', profilePicture: null }).success).toBe(true);
  });

  it('should reject invalid email', () => {
    expect(createUserSchema.safeParse({ email: 'invalid', name: 'Test' }).success).toBe(false);
  });

  it('should reject missing email', () => {
    expect(createUserSchema.safeParse({ name: 'Test' }).success).toBe(false);
  });

  it('should reject missing name', () => {
    expect(createUserSchema.safeParse({ email: 'a@b.com' }).success).toBe(false);
  });

  it('should reject empty name', () => {
    expect(createUserSchema.safeParse({ email: 'a@b.com', name: '' }).success).toBe(false);
  });

  it('should reject name over 255 chars', () => {
    expect(createUserSchema.safeParse({ email: 'a@b.com', name: 'x'.repeat(256) }).success).toBe(false);
  });

  it('should reject invalid profilePicture URL', () => {
    expect(createUserSchema.safeParse({ email: 'a@b.com', name: 'A', profilePicture: 'not-a-url' }).success).toBe(false);
  });

  it('should reject extra fields (strict)', () => {
    expect(createUserSchema.safeParse({ email: 'a@b.com', name: 'A', extra: true }).success).toBe(false);
  });
});

// ============================================
// updateUserStatusSchema
// ============================================
describe('updateUserStatusSchema', () => {
  it('should accept true', () => {
    expect(updateUserStatusSchema.safeParse({ isActive: true }).success).toBe(true);
  });

  it('should accept false', () => {
    expect(updateUserStatusSchema.safeParse({ isActive: false }).success).toBe(true);
  });

  it('should reject string', () => {
    expect(updateUserStatusSchema.safeParse({ isActive: 'true' }).success).toBe(false);
  });

  it('should reject missing isActive', () => {
    expect(updateUserStatusSchema.safeParse({}).success).toBe(false);
  });

  it('should reject extra fields (strict)', () => {
    expect(updateUserStatusSchema.safeParse({ isActive: true, extra: 1 }).success).toBe(false);
  });
});

// ============================================
// assignAppRoleSchema
// ============================================
describe('assignAppRoleSchema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('should accept valid UUIDs', () => {
    expect(assignAppRoleSchema.safeParse({ appId: validUUID, roleId: validUUID }).success).toBe(true);
  });

  it('should reject invalid appId', () => {
    expect(assignAppRoleSchema.safeParse({ appId: 'not-uuid', roleId: validUUID }).success).toBe(false);
  });

  it('should reject invalid roleId', () => {
    expect(assignAppRoleSchema.safeParse({ appId: validUUID, roleId: 'bad' }).success).toBe(false);
  });

  it('should reject missing appId', () => {
    expect(assignAppRoleSchema.safeParse({ roleId: validUUID }).success).toBe(false);
  });

  it('should reject missing roleId', () => {
    expect(assignAppRoleSchema.safeParse({ appId: validUUID }).success).toBe(false);
  });

  it('should reject extra fields (strict)', () => {
    expect(assignAppRoleSchema.safeParse({ appId: validUUID, roleId: validUUID, extra: true }).success).toBe(false);
  });
});

// ============================================
// removeAppRoleSchema
// ============================================
describe('removeAppRoleSchema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('should accept valid appId', () => {
    expect(removeAppRoleSchema.safeParse({ appId: validUUID }).success).toBe(true);
  });

  it('should reject invalid appId', () => {
    expect(removeAppRoleSchema.safeParse({ appId: 'not-a-uuid' }).success).toBe(false);
  });

  it('should reject missing appId', () => {
    expect(removeAppRoleSchema.safeParse({}).success).toBe(false);
  });

  it('should reject extra fields (strict)', () => {
    expect(removeAppRoleSchema.safeParse({ appId: validUUID, extra: 1 }).success).toBe(false);
  });
});

// ============================================
// uuidParamSchema
// ============================================
describe('uuidParamSchema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('should accept valid userId UUID', () => {
    expect(uuidParamSchema.safeParse({ userId: validUUID }).success).toBe(true);
  });

  it('should reject invalid userId', () => {
    expect(uuidParamSchema.safeParse({ userId: '123' }).success).toBe(false);
  });

  it('should reject missing userId', () => {
    expect(uuidParamSchema.safeParse({}).success).toBe(false);
  });

  it('should reject extra fields (strict)', () => {
    expect(uuidParamSchema.safeParse({ userId: validUUID, extra: true }).success).toBe(false);
  });
});

// ============================================
// appCodeParamSchema
// ============================================
describe('appCodeParamSchema', () => {
  it('should accept valid appCode', () => {
    expect(appCodeParamSchema.safeParse({ appCode: 'pricelab' }).success).toBe(true);
  });

  it('should reject empty appCode', () => {
    expect(appCodeParamSchema.safeParse({ appCode: '' }).success).toBe(false);
  });

  it('should reject missing appCode', () => {
    expect(appCodeParamSchema.safeParse({}).success).toBe(false);
  });

  it('should reject extra fields (strict)', () => {
    expect(appCodeParamSchema.safeParse({ appCode: 'app', extra: 1 }).success).toBe(false);
  });
});
