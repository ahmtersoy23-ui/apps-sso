import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from './auth';

// Mock jwt-decode
vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn((token: string) => {
    if (token === 'valid-token') {
      return {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        apps: { stockpulse: 'editor' },
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };
    }
    if (token === 'expired-token') {
      return {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        apps: {},
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };
    }
    throw new Error('Invalid token');
  }),
}));

// Mock apiService to avoid circular dependency issues
vi.mock('./api', () => ({
  apiService: {
    refreshToken: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('setTokens / getAccessToken / getRefreshToken', () => {
    it('stores and retrieves access token', () => {
      authService.setTokens('access-123', 'refresh-456');
      expect(authService.getAccessToken()).toBe('access-123');
    });

    it('stores and retrieves refresh token', () => {
      authService.setTokens('access-123', 'refresh-456');
      expect(authService.getRefreshToken()).toBe('refresh-456');
    });

    it('returns null when no access token is set', () => {
      expect(authService.getAccessToken()).toBeNull();
    });

    it('returns null when no refresh token is set', () => {
      expect(authService.getRefreshToken()).toBeNull();
    });
  });

  describe('setUser / getUser', () => {
    it('stores and retrieves user', () => {
      const user = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        apps: { stockpulse: 'editor' },
      };
      authService.setUser(user as any);
      expect(authService.getUser()).toEqual(user);
    });

    it('returns null when no user is set', () => {
      expect(authService.getUser()).toBeNull();
    });

    it('returns null when stored user is invalid JSON', () => {
      localStorage.setItem('user', 'not-valid-json');
      expect(authService.getUser()).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('decodes a valid token', () => {
      const decoded = authService.decodeToken('valid-token');
      expect(decoded).not.toBeNull();
      expect(decoded?.email).toBe('test@example.com');
      expect(decoded?.name).toBe('Test User');
    });

    it('returns null for an invalid token', () => {
      const decoded = authService.decodeToken('invalid-token');
      expect(decoded).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('returns false for a valid (non-expired) token', () => {
      expect(authService.isTokenExpired('valid-token')).toBe(false);
    });

    it('returns true for an expired token', () => {
      expect(authService.isTokenExpired('expired-token')).toBe(true);
    });

    it('returns true for an invalid token', () => {
      expect(authService.isTokenExpired('invalid-token')).toBe(true);
    });
  });

  describe('isAuthenticated', () => {
    it('returns false when no token exists', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('returns true when a valid token exists', () => {
      authService.setTokens('valid-token', 'refresh-456');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('returns false when an expired token exists', () => {
      authService.setTokens('expired-token', 'refresh-456');
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('logout', () => {
    it('clears all auth data from localStorage', () => {
      authService.setTokens('access-123', 'refresh-456');
      authService.setUser({
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        apps: {},
      } as any);

      authService.logout();

      expect(authService.getAccessToken()).toBeNull();
      expect(authService.getRefreshToken()).toBeNull();
      expect(authService.getUser()).toBeNull();
    });
  });
});
