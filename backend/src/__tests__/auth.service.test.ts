import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import type { User, TokenPayload } from '../types';

// JWT_SECRET ortam degiskeninin test ortaminda set edilmis olmasi gerekir.
// .env dosyasi veya CI'da deploy.yml `env:` blogunda saglanir.
// secretsService cache bos oldugunda process.env'e fallback eder.

const fakeUser: User = {
  user_id: '00000000-0000-0000-0000-000000000001',
  email: 'test-user@iwaconcept.com.tr',
  name: 'Test User',
  profile_picture: 'https://example.com/pic.jpg',
  is_active: true,
  is_email_verified: true,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

const fakeApps = { 'apps-sso': 'admin', stockpulse: 'viewer' };

describe('AuthService.generateTokens', () => {
  beforeAll(() => {
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'test-jwt-secret-for-unit-tests-only-1234567890';
    }
    if (!process.env.JWT_REFRESH_SECRET) {
      process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-unit-tests-only-1234567890';
    }
  });

  it('produces both access and refresh tokens', () => {
    const { accessToken, refreshToken } = AuthService.generateTokens(fakeUser, fakeApps);
    expect(accessToken).toEqual(expect.any(String));
    expect(refreshToken).toEqual(expect.any(String));
    expect(accessToken).not.toEqual(refreshToken);
  });

  it('access token payload contains user identity and apps map', () => {
    const { accessToken } = AuthService.generateTokens(fakeUser, fakeApps);
    const decoded = jwt.decode(accessToken) as TokenPayload;
    expect(decoded.sub).toBe(fakeUser.user_id);
    expect(decoded.email).toBe(fakeUser.email);
    expect(decoded.name).toBe(fakeUser.name);
    expect(decoded.picture).toBe(fakeUser.profile_picture);
    expect(decoded.apps).toEqual(fakeApps);
  });

  it('refresh token contains only sub claim (no apps map leak)', () => {
    const { refreshToken } = AuthService.generateTokens(fakeUser, fakeApps);
    const decoded = jwt.decode(refreshToken) as Record<string, unknown>;
    expect(decoded.sub).toBe(fakeUser.user_id);
    expect(decoded.apps).toBeUndefined();
    expect(decoded.email).toBeUndefined();
  });

  it('access token is signed with JWT_SECRET (not refresh secret)', () => {
    const { accessToken } = AuthService.generateTokens(fakeUser, fakeApps);
    expect(() => jwt.verify(accessToken, process.env.JWT_SECRET!)).not.toThrow();
    expect(() => jwt.verify(accessToken, process.env.JWT_REFRESH_SECRET!)).toThrow();
  });

  it('refresh token is signed with JWT_REFRESH_SECRET (not access secret)', () => {
    const { refreshToken } = AuthService.generateTokens(fakeUser, fakeApps);
    expect(() => jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!)).not.toThrow();
    expect(() => jwt.verify(refreshToken, process.env.JWT_SECRET!)).toThrow();
  });
});

describe('AuthService.verifyToken', () => {
  it('returns payload for valid token', () => {
    const { accessToken } = AuthService.generateTokens(fakeUser, fakeApps);
    const payload = AuthService.verifyToken(accessToken);
    expect(payload.sub).toBe(fakeUser.user_id);
    expect(payload.apps).toEqual(fakeApps);
  });

  it('throws on tampered token', () => {
    const { accessToken } = AuthService.generateTokens(fakeUser, fakeApps);
    const tampered = accessToken.slice(0, -2) + 'XX';
    expect(() => AuthService.verifyToken(tampered)).toThrow();
  });

  it('throws on token signed with wrong secret', () => {
    const forged = jwt.sign({ sub: 'fake-user-id', apps: { 'apps-sso': 'admin' } }, 'wrong-secret');
    expect(() => AuthService.verifyToken(forged)).toThrow();
  });

  it('throws on expired token', () => {
    const expired = jwt.sign(
      { sub: fakeUser.user_id, email: fakeUser.email, name: fakeUser.name, apps: fakeApps },
      process.env.JWT_SECRET!,
      { expiresIn: '-1s' }
    );
    expect(() => AuthService.verifyToken(expired)).toThrow();
  });
});
