import type { Application, LoginResponse, ApiResponse } from '../types';

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
      body: JSON.stringify({ token: googleToken }),
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
}

export const apiService = new ApiService();
