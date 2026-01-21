-- IWA Apps SSO - Database Initialization Script
-- Database: apps_db
-- Created: 2026-01-21

-- 1. Create database (run this as postgres user first)
-- CREATE DATABASE apps_db WITH OWNER = postgres ENCODING = 'UTF8' LC_COLLATE = 'en_US.UTF-8' LC_CTYPE = 'en_US.UTF-8';

-- 2. Connect to apps_db
\c apps_db

-- 3. Create SSO user
CREATE USER apps_sso WITH ENCRYPTED PASSWORD 'IWA_Apps_2026_Secure!';
GRANT CONNECT ON DATABASE apps_db TO apps_sso;

-- 4. Users Table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    profile_picture TEXT,
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP
);

COMMENT ON TABLE users IS 'Central user registry for IWA Apps ecosystem';
COMMENT ON COLUMN users.google_id IS 'Google OAuth unique identifier';

-- 5. Applications Table
CREATE TABLE applications (
    app_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_code VARCHAR(50) UNIQUE NOT NULL,
    app_name VARCHAR(255) NOT NULL,
    app_description TEXT,
    app_url VARCHAR(500) NOT NULL,
    app_icon VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    requires_subdomain BOOLEAN DEFAULT false,
    subdomain_prefix VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE applications IS 'Registry of all applications in the ecosystem';
COMMENT ON COLUMN applications.app_code IS 'Unique identifier code (e.g., stockpulse, pricelab)';

-- 6. Roles Table
CREATE TABLE roles (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_code VARCHAR(50) UNIQUE NOT NULL,
    role_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE roles IS 'System and custom roles';
COMMENT ON COLUMN roles.is_system_role IS 'True for admin/editor/viewer, false for custom roles';

-- 7. User-App-Role Mapping
CREATE TABLE user_app_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    app_id UUID NOT NULL REFERENCES applications(app_id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(user_id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    UNIQUE(user_id, app_id)
);

COMMENT ON TABLE user_app_roles IS 'Maps users to applications with specific roles';
COMMENT ON CONSTRAINT user_app_roles_user_id_app_id_key ON user_app_roles IS 'One user can only have one role per application';

-- 8. Auth Tokens Table
CREATE TABLE auth_tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE auth_tokens IS 'JWT tokens and refresh tokens storage';

-- 9. Audit Logs Table
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,
    app_id UUID REFERENCES applications(app_id),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Security and activity audit trail';
COMMENT ON COLUMN audit_logs.action IS 'e.g., login, logout, role_change, permission_denied';

-- 10. Indexes for Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_is_active ON users(is_active);

CREATE INDEX idx_applications_code ON applications(app_code);
CREATE INDEX idx_applications_active ON applications(is_active);

CREATE INDEX idx_user_app_roles_user ON user_app_roles(user_id);
CREATE INDEX idx_user_app_roles_app ON user_app_roles(app_id);
CREATE INDEX idx_user_app_roles_role ON user_app_roles(role_id);

CREATE INDEX idx_auth_tokens_user ON auth_tokens(user_id);
CREATE INDEX idx_auth_tokens_expires ON auth_tokens(expires_at);
CREATE INDEX idx_auth_tokens_revoked ON auth_tokens(is_revoked);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_app ON audit_logs(app_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- 11. Initial System Roles
INSERT INTO roles (role_code, role_name, description, is_system_role) VALUES
('admin', 'Administrator', 'Full access to all features including user management', true),
('editor', 'Editor', 'Can create, edit, and delete content but cannot manage users', true),
('viewer', 'Viewer', 'Read-only access to application data', true);

-- 12. Initial Applications
INSERT INTO applications (app_code, app_name, app_description, app_url, subdomain_prefix, requires_subdomain) VALUES
('amzsellmetrics', 'Amazon Sell Metrics', 'Amazon marketplace analytics and profitability tracking', 'https://amzsellmetrics.iwa.web.tr', NULL, false),
('stockpulse', 'StockPulse', 'Inventory management and stock tracking system', 'https://stockpulse.iwa.web.tr', NULL, false),
('pricelab', 'PriceLab', 'Product pricing and cost analysis platform', 'https://pricelab.iwa.web.tr', NULL, false),
('manumaestro', 'ManuMaestro', 'Manufacturing and production management', 'https://manumaestro.apps.iwa.web.tr', 'apps', true),
('swiftstock', 'SwiftStock WMS', 'Modern warehouse management system', 'https://swiftstock.apps.iwa.web.tr', 'apps', true);

-- 13. Grant Permissions to apps_sso user
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO apps_sso;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO apps_sso;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO apps_sso;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO apps_sso;

-- 14. Create admin user (ahmet@example.com) - Change email as needed
DO $$
DECLARE
    admin_user_id UUID;
    admin_role_id UUID;
BEGIN
    -- Insert admin user
    INSERT INTO users (email, name, is_active, is_email_verified)
    VALUES ('ahmet@iwaapps.com', 'Ahmet Ersoy', true, true)
    RETURNING user_id INTO admin_user_id;

    -- Get admin role
    SELECT role_id INTO admin_role_id FROM roles WHERE role_code = 'admin';

    -- Grant admin access to all applications
    INSERT INTO user_app_roles (user_id, app_id, role_id, assigned_by)
    SELECT admin_user_id, app_id, admin_role_id, admin_user_id
    FROM applications;

    RAISE NOTICE 'Admin user created: ahmet@iwaapps.com with admin access to all apps';
END $$;

-- 15. Verification queries
SELECT 'Database Initialization Complete!' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_apps FROM applications;
SELECT COUNT(*) as total_roles FROM roles;
SELECT COUNT(*) as total_permissions FROM user_app_roles;

-- Show admin user permissions
SELECT
    u.email,
    u.name,
    a.app_name,
    r.role_name
FROM user_app_roles uar
JOIN users u ON uar.user_id = u.user_id
JOIN applications a ON uar.app_id = a.app_id
JOIN roles r ON uar.role_id = r.role_id
WHERE u.email = 'ahmet@iwaapps.com';
