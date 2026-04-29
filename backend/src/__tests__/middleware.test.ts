import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, validateBody, validateQuery, validateParams } from '../middleware/validate';
import { requireRole, requireSsoAdmin, isSsoAdmin } from '../middleware/auth.middleware';
import type { AuthRequest } from '../middleware/auth.middleware';

// Helper: build a mock auth request with user payload
const makeReq = (overrides: Partial<AuthRequest['user']> = {}): AuthRequest =>
  ({
    user: {
      sub: '123',
      email: 'normal@iwaconcept.com.tr',
      name: 'Normal',
      apps: {},
      iat: 0,
      exp: 0,
      ...overrides,
    },
  }) as unknown as AuthRequest;

// ============================================
// Validate Middleware
// ============================================
describe('validate middleware', () => {
  const schema = z.object({ name: z.string().min(1) }).strict();

  const mockRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = jest.fn() as NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call next() on valid body', () => {
    const req = { body: { name: 'test' } } as Request;
    const res = mockRes();
    validateBody(schema)(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(req.body).toEqual({ name: 'test' });
  });

  it('should return 400 on invalid body', () => {
    const req = { body: { name: '' } } as Request;
    const res = mockRes();
    validateBody(schema)(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Validation failed' })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 400 on extra fields (strict)', () => {
    const req = { body: { name: 'test', extra: true } } as Request;
    const res = mockRes();
    validateBody(schema)(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should validate query params', () => {
    const req = { query: { name: 'test' } } as unknown as Request;
    const res = mockRes();
    validateQuery(schema)(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should validate route params', () => {
    const req = { params: { name: 'test' } } as unknown as Request;
    const res = mockRes();
    validateParams(schema)(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should include field details in error response', () => {
    const req = { body: {} } as Request;
    const res = mockRes();
    validateBody(schema)(req, res, mockNext);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.arrayContaining([
          expect.objectContaining({ field: expect.any(String), message: expect.any(String) }),
        ]),
      })
    );
  });

  it('validate factory defaults to body', () => {
    const req = { body: { name: 'test' } } as Request;
    const res = mockRes();
    validate(schema)(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});

// ============================================
// requireRole Middleware
// ============================================
describe('requireRole middleware', () => {
  const mockRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = jest.fn() as NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call next() when user has required role', () => {
    const req = {
      user: {
        sub: '123',
        email: 'test@test.com',
        name: 'Test',
        apps: { 'apps-sso': 'admin' },
        iat: 0,
        exp: 0,
      },
    } as unknown as AuthRequest;
    const res = mockRes();
    requireRole(['admin'])(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 403 when user lacks required role', () => {
    const req = {
      user: {
        sub: '123',
        email: 'test@test.com',
        name: 'Test',
        apps: { 'apps-sso': 'viewer' },
        iat: 0,
        exp: 0,
      },
    } as unknown as AuthRequest;
    const res = mockRes();
    requireRole(['admin'])(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when no user on request', () => {
    const req = {} as unknown as AuthRequest;
    const res = mockRes();
    requireRole(['admin'])(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should accept any of multiple allowed roles', () => {
    const req = {
      user: {
        sub: '123',
        email: 'test@test.com',
        name: 'Test',
        apps: { pricelab: 'editor' },
        iat: 0,
        exp: 0,
      },
    } as unknown as AuthRequest;
    const res = mockRes();
    requireRole(['admin', 'editor'])(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should check across all apps for role (no appCode = cross-app, deprecated)', () => {
    const req = {
      user: {
        sub: '123',
        email: 'test@test.com',
        name: 'Test',
        apps: { pricelab: 'viewer', amzsellmetrics: 'admin' },
        iat: 0,
        exp: 0,
      },
    } as unknown as AuthRequest;
    const res = mockRes();
    requireRole(['admin'])(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should require role on specific app when appCode given', () => {
    const req = makeReq({ apps: { pricelab: 'admin', 'apps-sso': 'viewer' } });
    const res = mockRes();
    requireRole(['admin'], 'apps-sso')(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should pass when appCode given and user has matching app role', () => {
    const req = makeReq({ apps: { 'apps-sso': 'admin' } });
    const res = mockRes();
    requireRole(['admin'], 'apps-sso')(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should 403 when appCode given but user has no role on that app', () => {
    const req = makeReq({ apps: { pricelab: 'admin' } });
    const res = mockRes();
    requireRole(['admin'], 'apps-sso')(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });
});

// ============================================
// isSsoAdmin Helper (privilege escalation guard)
// ============================================
describe('isSsoAdmin helper', () => {
  it('returns true for user with apps-sso/admin role (RBAC)', () => {
    const req = makeReq({ apps: { 'apps-sso': 'admin' } });
    expect(isSsoAdmin(req)).toBe(true);
  });

  it('returns true for super admin email (hardgate, ersoy)', () => {
    const req = makeReq({ email: 'ersoy@iwaconcept.com.tr', apps: {} });
    expect(isSsoAdmin(req)).toBe(true);
  });

  it('returns true for super admin email (hardgate, huseyin)', () => {
    const req = makeReq({ email: 'huseyin@iwaconcept.com.tr', apps: {} });
    expect(isSsoAdmin(req)).toBe(true);
  });

  // REGRESSION: Privilege escalation. Eskiden "herhangi bir app'te admin" SSO admin sayilirdi.
  // Bu davranis ARTIK kabul edilmiyor. Bu test bozulursa guvenlik geri adim atilmis demektir.
  it('returns false for cross-app admin who is NOT apps-sso admin or super email', () => {
    const req = makeReq({
      email: 'attacker@iwaconcept.com.tr',
      apps: { stockpulse: 'admin', amzsellmetrics: 'admin', pricelab: 'admin' },
    });
    expect(isSsoAdmin(req)).toBe(false);
  });

  it('returns false for user with apps-sso/viewer role', () => {
    const req = makeReq({ apps: { 'apps-sso': 'viewer' } });
    expect(isSsoAdmin(req)).toBe(false);
  });

  it('returns false for user with apps-sso/editor role', () => {
    const req = makeReq({ apps: { 'apps-sso': 'editor' } });
    expect(isSsoAdmin(req)).toBe(false);
  });

  it('returns false for unauthenticated request', () => {
    expect(isSsoAdmin({} as AuthRequest)).toBe(false);
  });

  it('returns false for user with empty apps map and non-super email', () => {
    const req = makeReq({ email: 'random@gmail.com', apps: {} });
    expect(isSsoAdmin(req)).toBe(false);
  });
});

// ============================================
// requireSsoAdmin Middleware
// ============================================
describe('requireSsoAdmin middleware', () => {
  const mockRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };
  const mockNext = jest.fn() as NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls next() when user is SSO admin via RBAC', () => {
    const req = makeReq({ apps: { 'apps-sso': 'admin' } });
    const res = mockRes();
    requireSsoAdmin(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('calls next() when user is super admin via email hardgate', () => {
    const req = makeReq({ email: 'ersoy@iwaconcept.com.tr', apps: {} });
    const res = mockRes();
    requireSsoAdmin(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  // REGRESSION: cross-app admin should NOT pass requireSsoAdmin.
  it('returns 403 when user is admin in another app but not apps-sso admin', () => {
    const req = makeReq({
      email: 'tuncay@iwaconcept.com.tr',
      apps: { stockpulse: 'admin', amzsellmetrics: 'admin' },
    });
    const res = mockRes();
    requireSsoAdmin(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'SSO admin access required' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 when no user on request', () => {
    const req = {} as AuthRequest;
    const res = mockRes();
    requireSsoAdmin(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 403 when user has apps-sso/viewer (not admin)', () => {
    const req = makeReq({ apps: { 'apps-sso': 'viewer' } });
    const res = mockRes();
    requireSsoAdmin(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });
});

// ============================================
// Audit Log Utility
// ============================================
describe('auditLog', () => {
  it('module exports logAudit function', async () => {
    const { logAudit } = await import('../utils/auditLog');
    expect(typeof logAudit).toBe('function');
  });
});
