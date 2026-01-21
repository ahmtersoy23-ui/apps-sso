export interface User {
  user_id: string;
  email: string;
  name: string;
  google_id?: string;
  profile_picture?: string;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
}

export interface Application {
  app_id: string;
  app_code: string;
  app_name: string;
  app_description?: string;
  app_url: string;
  app_icon?: string;
  is_active: boolean;
  requires_subdomain: boolean;
  subdomain_prefix?: string;
  created_at: Date;
}

export interface Role {
  role_id: string;
  role_code: string;
  role_name: string;
  description?: string;
  is_system_role: boolean;
  created_at: Date;
}

export interface UserAppRole {
  id: string;
  user_id: string;
  app_id: string;
  role_id: string;
  assigned_by?: string;
  assigned_at: Date;
  expires_at?: Date;
}

export interface TokenPayload {
  sub: string; // user_id
  email: string;
  name: string;
  picture?: string;
  apps: Record<string, string>; // app_code -> role_code
  iat: number;
  exp: number;
}

export interface AuthRequest extends Express.Request {
  user?: TokenPayload;
}
