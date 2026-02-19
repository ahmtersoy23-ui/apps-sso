import type { Application, LoginResponse, ApiResponse, AdminUser, AdminApplication, Role } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'https://apps.iwa.web.tr/api';

class ApiService {
  private getHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async googleLogin(googleToken: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ credential: googleToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  }

  async refreshAccessToken(): Promise<ApiResponse<{ accessToken: string; refreshToken: string; apps: Record<string, string> }>> {
    const response = await fetch(`${API_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  }

  async logout(): Promise<void> {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: this.getHeaders(true),
    });
  }

  async getAllApps(): Promise<ApiResponse<Application[]>> {
    const response = await fetch(`${API_URL}/apps`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch applications');
    }

    return response.json();
  }

  async getMyApps(): Promise<ApiResponse<Application[]>> {
    const response = await fetch(`${API_URL}/apps/my`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user applications');
    }

    return response.json();
  }

  // Admin API methods
  async getAdminUsers(): Promise<ApiResponse<AdminUser[]>> {
    const response = await fetch(`${API_URL}/admin/users`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    return response.json();
  }

  async toggleUserStatus(userId: string, isActive: boolean): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
      body: JSON.stringify({ is_active: isActive }),
    });

    if (!response.ok) {
      throw new Error('Failed to update user status');
    }

    return response.json();
  }

  async assignAppRole(userId: string, appId: string, roleId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/admin/users/${userId}/apps`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ app_id: appId, role_id: roleId }),
    });

    if (!response.ok) {
      throw new Error('Failed to assign app role');
    }

    return response.json();
  }

  async removeAppAccess(userId: string, appId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/admin/users/${userId}/apps/${appId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to remove app access');
    }

    return response.json();
  }

  async getAdminApplications(): Promise<ApiResponse<AdminApplication[]>> {
    const response = await fetch(`${API_URL}/admin/applications`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch applications');
    }

    return response.json();
  }

  async getRoles(): Promise<ApiResponse<Role[]>> {
    const response = await fetch(`${API_URL}/admin/roles`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch roles');
    }

    return response.json();
  }

  async createUser(email: string, name: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/admin/users`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ email, name }),
    });

    if (!response.ok) {
      throw new Error('Failed to create user');
    }

    return response.json();
  }
}

export const apiService = new ApiService();
