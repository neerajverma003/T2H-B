import allowedOrigins from './allowedOrigin.js';

export const corsOptions = {
  origin: (origin, callback) => {
    // 1. Allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    // 2. Normalize origin (strip trailing slash)
    const normalizedOrigin = origin.replace(/\/$/, '');

    // 3. DEVELOPMENT BYPASS
    // In non-production, allow all origins for developer convenience
    if ((process.env.NODE_ENV || 'development') !== 'production') {
      return callback(null, true);
    }

    // 4. PRODUCTION WHITELIST
    // Check against explicit allowedOrigins array
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // 5. LOCALHOST FALLBACK (Safety)
    if (normalizedOrigin.includes('localhost') || normalizedOrigin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // 6. DYNAMIC OVERRIDE (Env Variable)
    if (process.env.ALLOW_ALL_ORIGINS === 'true') {
      return callback(null, true);
    }

    console.warn('[CORS] Blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
