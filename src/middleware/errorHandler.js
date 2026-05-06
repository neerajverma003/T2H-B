/**
 * GLOBAL ERROR HANDLER
 * --------------------
 * Captures all unhandled errors in the middleware chain.
 * In production, it hides sensitive stack traces to prevent data leakage.
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  console.error(`[ERROR] ${new Date().toISOString()}:`, {
    message: err.message,
    stack: isProduction ? '🥞 Hidden in production' : err.stack,
    path: req.path,
    method: req.method
  });

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: err.message || 'Internal Server Error',
    // Only show stack trace in development
    ...(isProduction ? {} : { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
};

/**
 * 404 NOT FOUND HANDLER
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};
