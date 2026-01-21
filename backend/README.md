# IWA Apps - Central SSO Backend

Merkezi Single Sign-On ve yetkilendirme sistemi.

## 🚀 Quick Start (Local)

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env and configure Google OAuth credentials

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## 📦 Deployment to Server

```bash
# 1. Build locally
npm install
npm run build

# 2. Copy to server
scp -r dist package.json package-lock.json ecosystem.config.js .env root@78.47.117.36:/var/www/apps-sso-backend/

# 3. On server
ssh root@78.47.117.36
cd /var/www/apps-sso-backend
npm ci --production

# Create log directory
mkdir -p /var/log/apps-sso

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
```

## 🔐 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins:
   - `https://apps.iwa.web.tr`
   - `http://localhost:5173` (for development)
6. Add authorized redirect URIs:
   - `https://apps.iwa.web.tr/auth/callback`
7. Copy Client ID and Client Secret to `.env`

## 📡 API Endpoints

### Auth
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - Logout (revoke token)
- `GET /api/auth/me` - Get current user info

### Apps
- `GET /api/apps` - List all applications
- `GET /api/apps/my` - Get user's applications with roles

### Health
- `GET /health` - Health check

## 🔧 Environment Variables

See `.env.example` for all configuration options.

## 📊 Database

Database: `apps_db` on localhost PostgreSQL
Schema initialized with `/init-apps-db.sql`

## 🎯 Admin User

Email: `ersoy@iwaconcept.com.tr`
Has admin access to all applications.
