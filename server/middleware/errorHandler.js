// middleware/errorHandler.js
// Global error handler — catches ALL unhandled errors
// Must be last middleware in app.js

const logger = require('../utils/logger');

// ── Not Found Handler (404) ──────────────────────────────────
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// ── Global Error Handler ─────────────────────────────────────
const errorHandler = (err, req, res, next) => {

  // Log the error
  logger.error(`${err.statusCode || 500} — ${err.message}`);

  // Mongoose duplicate key error (e.g. email already exists)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists. Please use a different one.`,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors)
      .map(e => e.message)
      .join(', ');
    return res.status(400).json({
      success: false,
      message: messages,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please login again.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired. Please login again.',
    });
  }

  // Default error response
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Only show stack trace in development
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack
    }),
  });
};

module.exports = { notFound, errorHandler };