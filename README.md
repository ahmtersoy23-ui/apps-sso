# IWA Apps SSO - Single Sign-On System

> Centralized authentication and authorization system for IWA Apps ecosystem

[![Live](https://img.shields.io/badge/live-apps.iwa.web.tr-blue)](https://apps.iwa.web.tr)
[![Status](https://img.shields.io/badge/status-production-success)](https://apps.iwa.web.tr/api/health)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## 🌟 Overview

IWA Apps SSO is a self-hosted, open-source Single Sign-On (SSO) system designed to provide centralized authentication and role-based authorization for the IWA Apps ecosystem. Think of it as a lightweight, self-hosted alternative to Okta or Auth0, tailored for your applications.

**Live Application:** [https://apps.iwa.web.tr](https://apps.iwa.web.tr)

---

## ✨ Features

### Authentication
- 🔐 **Google OAuth 2.0** - Secure login with Google accounts
- 🎫 **JWT Tokens** - Access and refresh token management
- ♻️ **Auto-refresh** - Seamless token renewal
- 🚪 **Single Sign-On** - One login for all applications

### Authorization
- 👥 **Role-Based Access Control (RBAC)** - Admin, Editor, Viewer roles
- 🎯 **Per-App Roles** - Different roles in different applications
- 🔒 **Protected Routes** - Authentication guards
- 📊 **User Permissions** - Fine-grained access control

### User Experience
- 📱 **Responsive Design** - Works on all devices
- 🎨 **Modern UI** - Built with TailwindCSS
- ⚡ **Fast** - React SPA with optimized bundles
- 🖼️ **Application Cards** - Visual dashboard with app tiles

### Infrastructure
- 🚀 **Production Ready** - Deployed and running
- 🔐 **HTTPS** - SSL/TLS encryption
- 📦 **Redis Caching** - Fast token validation
- 🗄️ **PostgreSQL** - Reliable data storage
- 🔄 **PM2** - Process management with auto-restart

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  apps.iwa.web.tr (HTTPS)                │
│                  Nginx Reverse Proxy                     │
└────────────┬────────────────────────────┬───────────────┘
             │                            │
    ┌────────▼────────┐          ┌────────▼────────┐
    │   Frontend      │          │   Backend       │
    │   React SPA     │          │   Express API   │
    │   Port: Static  │          │   Port: 3005    │
    └─────────────────┘          └────────┬────────┘
                                          │
                      ┌───────────────────┼───────────────────┐
                      │                   │                   │
             ┌────────▼────────┐  ┌───────▼──────┐  ┌────────▼────────┐
             │   PostgreSQL    │  │    Redis     │  │  Google OAuth   │
             │   apps_db       │  │   Cache      │  │   Provider      │
             │   Port: 5432    │  │   Port: 6379 │  │                 │
             └─────────────────┘  └──────────────┘  └─────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 7
- **Styling:** TailwindCSS 4
- **Router:** React Router v7
- **OAuth:** @react-oauth/google
- **Auth:** JWT (jwt-decode)

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL 16
- **Cache:** Redis 7
- **Auth:** JWT + Google OAuth 2.0
- **Security:** Helmet, CORS, Rate Limiting

### Infrastructure
- **Server:** Ubuntu 24.04 ARM64
- **Web Server:** Nginx 1.24
- **Process Manager:** PM2
- **SSL:** Let's Encrypt (Certbot)
- **RAM:** 3.7GB (2.7GB available)
- **Disk:** 38GB (26GB available)

---

## 📦 Installation

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- PM2 (for production)
- Nginx (for production)

### Database Setup

```bash
# Create database and tables
psql -U postgres < init-apps-db.sql

# Verify
psql -U postgres -d apps_db -c "\dt"
```

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run build
npm start
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.development .env
# Edit .env with your API URL and Google Client ID
npm run dev
```

---

## 🚀 Deployment

### Quick Deploy

```bash
# Backend
cd backend
npm run build
pm2 start ecosystem.config.js

# Frontend
cd frontend
npm run build
# Copy dist/ to web server
```

### Detailed deployment instructions:
- See [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) for complete deployment guide
- See [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) for OAuth configuration

---

## 📚 API Documentation

### Public Endpoints

#### Health Check
```bash
GET /health
```
Response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-21T10:00:00.000Z",
  "database": "connected"
}
```

### Authentication Endpoints

#### Google OAuth Login
```bash
POST /api/auth/google
Content-Type: application/json

{
  "token": "GOOGLE_ID_TOKEN"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "sub": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "picture": "https://...",
      "apps": {
        "stockpulse": "editor",
        "pricelab": "viewer"
      }
    },
    "accessToken": "JWT_ACCESS_TOKEN",
    "refreshToken": "JWT_REFRESH_TOKEN"
  }
}
```

#### Refresh Token
```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "JWT_REFRESH_TOKEN"
}
```

#### Logout
```bash
POST /api/auth/logout
Authorization: Bearer JWT_ACCESS_TOKEN
```

### Protected Endpoints

All protected endpoints require `Authorization: Bearer JWT_ACCESS_TOKEN` header.

#### List All Applications
```bash
GET /api/apps
```

#### Get User's Applications
```bash
GET /api/apps/my
```

---

## 🎯 Usage

### For End Users

1. Visit [https://apps.iwa.web.tr](https://apps.iwa.web.tr)
2. Click "Sign in with Google"
3. Authorize with your Google account
4. Access your applications from the dashboard

### For Developers

#### Integrate SSO with Your App

1. **Frontend - Redirect to SSO:**
```javascript
// Redirect to SSO for login
window.location.href = 'https://apps.iwa.web.tr';
```

2. **Backend - Verify JWT:**
```javascript
import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
```

3. **Check User Role:**
```javascript
const checkRole = (appCode, requiredRole) => {
  return (req, res, next) => {
    const userRole = req.user.apps[appCode];

    if (!userRole) {
      return res.status(403).json({ error: 'No access to this app' });
    }

    const roleHierarchy = { viewer: 1, editor: 2, admin: 3 };

    if (roleHierarchy[userRole] >= roleHierarchy[requiredRole]) {
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
};
```

---

## 🗄️ Database Schema

### Main Tables

- **users** - User accounts and profiles
- **applications** - Registered applications
- **roles** - Available roles (admin, editor, viewer)
- **user_app_roles** - User-Application-Role mapping
- **auth_tokens** - Active JWT tokens
- **audit_logs** - Security and access logs

See [init-apps-db.sql](init-apps-db.sql) for complete schema.

---

## 🔐 Security

### Implemented
- ✅ HTTPS/TLS encryption
- ✅ JWT with short-lived access tokens
- ✅ Refresh token rotation
- ✅ Redis token blacklisting on logout
- ✅ Rate limiting (100 req/15min)
- ✅ Helmet.js security headers
- ✅ CORS protection
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection

### Best Practices
- Store JWT secret securely (64+ characters)
- Never commit `.env` files
- Regular security audits
- Keep dependencies updated
- Monitor logs for suspicious activity

---

## 📊 Monitoring

### Health Check
```bash
curl https://apps.iwa.web.tr/api/health
```

### PM2 Status
```bash
pm2 status
pm2 logs apps-sso-backend
```

### Database Connections
```bash
sudo -u postgres psql -d apps_db -c "SELECT count(*) FROM pg_stat_activity;"
```

### Redis Stats
```bash
redis-cli info memory
redis-cli dbsize
```

---

## 🤝 Contributing

Contributions are welcome! This is an internal project for IWA Apps ecosystem.

### Development Workflow

1. Clone the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

---

## 📝 Documentation

- [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) - Complete deployment guide
- [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) - OAuth configuration (original)
- [GOOGLE_OAUTH_SETUP_NEW.md](GOOGLE_OAUTH_SETUP_NEW.md) - OAuth config (2026 UI)
- [SERVER_REFERENCE.md](../SERVER_REFERENCE.md) - Server management guide

---

## 🐛 Troubleshooting

### Frontend not loading
```bash
# Check Nginx status
systemctl status nginx

# Check Nginx logs
tail -f /var/log/nginx/apps_error.log
```

### Backend not responding
```bash
# Check PM2 status
pm2 status

# Check backend logs
pm2 logs apps-sso-backend --err

# Restart backend
pm2 restart apps-sso-backend --update-env
```

### Database connection failed
```bash
# Check PostgreSQL
systemctl status postgresql

# Test connection
psql -U postgres -d apps_db -c "SELECT 1;"
```

### Redis connection failed
```bash
# Check Redis
systemctl status redis-server

# Test connection
redis-cli ping
```

---

## 🎯 Roadmap

### Phase 1 ✅ (Completed)
- [x] Backend API with Google OAuth
- [x] JWT authentication
- [x] Frontend with login and dashboard
- [x] Role-based access control
- [x] Production deployment

### Phase 2 (Next)
- [ ] Admin panel for user management
- [ ] Application management interface
- [ ] Audit log viewer
- [ ] Email notifications

### Phase 3 (Future)
- [ ] Multi-factor authentication (MFA)
- [ ] SAML 2.0 support
- [ ] OAuth provider (allow other apps to use this as OAuth)
- [ ] Advanced analytics dashboard

---

## 📞 Support

**Admin Contact:** ersoy@iwaconcept.com.tr
**Server:** 78.47.117.36
**GitHub:** https://github.com/ahmtersoy23-ui/apps-sso

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Built with ❤️ for IWA Apps ecosystem
- Powered by modern open-source technologies
- Deployed on secure infrastructure

---

**Status:** 🟢 Production
**Version:** 1.0.0
**Last Updated:** 2026-01-21
**Developed by:** IWA Apps Team + Claude Sonnet 4.5
