// import allowedOrigin from './allowedOrigin.js';
// export const corsOptions = {
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true,
// };
// src/config/corsOption.js

// Allow override via environment variable (comma-separated), otherwise default local dev origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : [
      'http://localhost:5173', // frontend (Vite)
      'http://localhost:5174', // frontend (alternative Vite port)
      'http://localhost:3000', // optional
      // 👇 Add your production domains here OR set ALLOWED_ORIGINS env variable
      // 'https://triptohoneymoon.com',
      // 'https://admin.triptohoneymoon.com',
    ];

export const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like Postman or curl)
    if (!origin) return callback(null, true);

    // Normalize origin (strip trailing slash) for comparison
    const normalizedOrigin = origin.replace(/\/$/, '');

    // In non-production allow any origin (convenience for local/dev)
    if ((process.env.NODE_ENV || 'development') !== 'production') return callback(null, true);

    // Allow explicit configured origins
    const allowed = allowedOrigins.map(o => o.replace(/\/$/, ''));
    if (allowed.includes(normalizedOrigin)) return callback(null, true);

    // Allow localhost/127.0.0.1 automatically (covers Vite dev server variants)
    if (normalizedOrigin.includes('localhost') || normalizedOrigin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Allow all if explicitly requested via env
    if (process.env.ALLOW_ALL_ORIGINS === 'true') return callback(null, true);

    console.warn('[CORS] Blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
