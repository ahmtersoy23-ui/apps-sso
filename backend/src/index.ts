import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { pool } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { logger } from './config/logger';
import authRoutes from './routes/auth.routes';
import appsRoutes from './routes/apps.routes';
import adminRoutes from './routes/admin.routes';
import secretsRoutes from './routes/secrets.routes';
import internalRoutes from './routes/internal.routes';
import fundmateRoutes from './routes/fundmate.routes';
import { loadSecrets, getSecret } from './services/secretsService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust first proxy (nginx) — required for rate limiting & correct req.ip
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'unsafe-none' },
}));
app.use(compression());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'Too many requests from this IP, please try again later.',
    });
  },
});
// Apply general limiter to all /api/ routes EXCEPT /api/auth/verify (server-to-server internal call)
app.use('/api/', (req, res, next) => {
  if (req.path === '/auth/verify') return next();
  return limiter(req, res, next);
});

// High-volume limiter for /api/auth/verify (server-to-server, all app servers share one IP)
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 2000,           // 2000 req/min per IP (handles many concurrent users)
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'Too many requests from this IP, please try again later.',
    });
  },
});
app.use('/api/auth/verify', verifyLimiter);

// Stricter rate limit for auth endpoints (10 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later.',
    });
  },
});
app.use('/api/auth/google', authLimiter);

// Routes
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/apps', appsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', secretsRoutes);
app.use('/api/internal', internalRoutes);
app.use('/api/fundmate', fundmateRoutes);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to Redis
    await connectRedis();
    logger.info('✅ Redis connected');

    // Test database connection
    await pool.query('SELECT NOW()');
    logger.info('✅ Database connected');

    // Load JWT secrets from DB (overrides env if DB has rotated values)
    await loadSecrets();

    // Verify JWT secrets are available (from DB cache or env)
    if (!getSecret('JWT_SECRET') || !getSecret('JWT_REFRESH_SECRET')) {
      logger.error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET are not available (check .env or DB)');
      process.exit(1);
    }

    app.listen(PORT, () => {
      logger.info(`🚀 IWA Apps SSO Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await disconnectRedis();
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await disconnectRedis();
  await pool.end();
  process.exit(0);
});

startServer();
