export interface User {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  apps: Record<string, string>; // { "stockpulse": "editor", "pricelab": "viewer", ... }
  iat?: number;
  exp?: number;
}

export interface Application {
  app_id: string;
  app_code: string;
  app_name: string;
  app_description: string;
  app_url: string;
  app_icon?: string;
  app_type?: string; // 'application' or 'tool'
  role_code?: string;
  role_name?: string;
  role_description?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export interface AdminUser {
  user_id: string;
  email: string;
  name: string;
  profile_picture?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  apps: AdminUserApp[];
}

export interface AdminUserApp {
  app_id: string;
  app_code: string;
  app_name: string;
  role_code: string;
  role_name: string;
}

export interface AdminApplication {
  app_id: string;
  app_code: string;
  app_name: string;
  app_description: string;
  app_url: string;
  is_active: boolean;
  user_count: number;
}

export interface Role {
  role_id: string;
  role_code: string;
  role_name: string;
  role_description: string;
}

export interface SystemSecret {
  id: string;
  secret_key: string;
  version: number;
  rotated_at: string | null;
  rotated_by: string | null;
  rotated_by_name: string | null;
  has_previous: boolean;
}

export interface RotateSecretResponse {
  secret_key: string;
  version: number;
  rotated_at: string;
  new_value: string;
  affected_apps: string[];
  warning: string;
}

export interface RevertSecretResponse {
  secret_key: string;
  version: number;
  reverted_at: string;
  warning: string;
}
