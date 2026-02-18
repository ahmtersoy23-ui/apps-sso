import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, validateBody, validateQuery, validateParams } from '../middleware/validate';
import { requireRole } from '../middleware/auth.middleware';
import type { AuthRequest } from '../middleware/auth.middleware';

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

  it('should check across all apps for role', () => {
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
