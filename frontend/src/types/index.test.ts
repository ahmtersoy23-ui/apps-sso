import { describe, it, expect } from 'vitest';
import type {
  User,
  Application,
  AuthTokens,
  LoginResponse,
  ApiResponse,
  AdminUser,
  AdminUserApp,
  AdminApplication,
  Role,
} from './index';

// These tests validate that the type interfaces are structurally correct
// by creating conforming objects and asserting their shape at runtime.

describe('Type structures', () => {
  describe('User', () => {
    it('creates a valid user object', () => {
      const user: User = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        apps: { stockpulse: 'editor', pricelab: 'viewer' },
      };
      expect(user.sub).toBe('user-123');
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.apps).toEqual({ stockpulse: 'editor', pricelab: 'viewer' });
    });

    it('supports optional fields', () => {
      const user: User = {
        sub: 'user-456',
        email: 'admin@example.com',
        name: 'Admin User',
        picture: 'https://example.com/photo.jpg',
        apps: {},
        iat: 1700000000,
        exp: 1700003600,
      };
      expect(user.picture).toBe('https://example.com/photo.jpg');
      expect(user.iat).toBe(1700000000);
      expect(user.exp).toBe(1700003600);
    });
  });

  describe('Application', () => {
    it('creates a valid application object', () => {
      const app: Application = {
        app_id: 'app-1',
        app_code: 'stockpulse',
        app_name: 'StockPulse',
        app_description: 'Inventory tracking tool',
        app_url: 'https://stockpulse.iwa.web.tr',
      };
      expect(app.app_code).toBe('stockpulse');
      expect(app.app_url).toContain('https://');
    });

    it('supports optional fields', () => {
      const app: Application = {
        app_id: 'app-2',
        app_code: 'pricelab',
        app_name: 'PriceLab',
        app_description: 'Price analysis tool',
        app_url: 'https://pricelab.iwa.web.tr',
        app_icon: '/icons/pricelab.svg',
        app_type: 'application',
        role_code: 'admin',
        role_name: 'Admin',
        role_description: 'Full access',
      };
      expect(app.app_type).toBe('application');
      expect(app.role_code).toBe('admin');
    });
  });

  describe('AuthTokens', () => {
    it('creates a valid auth tokens object', () => {
      const tokens: AuthTokens = {
        accessToken: 'access-token-xyz',
        refreshToken: 'refresh-token-abc',
      };
      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();
    });
  });

  describe('LoginResponse', () => {
    it('creates a valid login response', () => {
      const response: LoginResponse = {
        success: true,
        data: {
          user: {
            sub: 'user-1',
            email: 'user@example.com',
            name: 'User One',
            apps: {},
          },
          accessToken: 'access-123',
          refreshToken: 'refresh-456',
        },
      };
      expect(response.success).toBe(true);
      expect(response.data.user.email).toBe('user@example.com');
      expect(response.data.accessToken).toBeTruthy();
    });
  });

  describe('ApiResponse', () => {
    it('creates a successful response', () => {
      const response: ApiResponse<string[]> = {
        success: true,
        data: ['item1', 'item2'],
      };
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(2);
    });

    it('creates an error response', () => {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: 'Something went wrong',
      };
      expect(response.success).toBe(false);
      expect(response.error).toBeTruthy();
    });
  });

  describe('AdminUser', () => {
    it('creates a valid admin user object', () => {
      const adminUser: AdminUser = {
        user_id: 'u-1',
        email: 'admin@example.com',
        name: 'Admin',
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        apps: [
          {
            app_id: 'app-1',
            app_code: 'stockpulse',
            app_name: 'StockPulse',
            role_code: 'admin',
            role_name: 'Admin',
          },
        ],
      };
      expect(adminUser.is_active).toBe(true);
      expect(adminUser.apps).toHaveLength(1);
      expect(adminUser.apps[0].role_code).toBe('admin');
    });
  });

  describe('Role', () => {
    it('creates a valid role object', () => {
      const role: Role = {
        role_id: 'r-1',
        role_code: 'admin',
        role_name: 'Administrator',
        role_description: 'Full system access',
      };
      expect(role.role_code).toBe('admin');
      expect(role.role_description).toContain('access');
    });
  });
});
