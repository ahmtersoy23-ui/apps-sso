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
