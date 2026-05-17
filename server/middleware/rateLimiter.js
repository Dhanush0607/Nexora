// middleware/rateLimiter.js
// Prevents brute force attacks by limiting requests
// Example: Max 10 login attempts per 15 minutes

const rateLimit = require('express-rate-limit');
const logger    = require('../utils/logger');

// ── Auth Rate Limiter ────────────────────────────────────────
// Strict limit for login and register
const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,  // 15 minutes
  max:              10,               // Max 10 requests
  message: {
    success: false,
    message: 'Too many attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
  handler: (req, res, next, options) => {
    logger.error(`Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json(options.message);
  },
});

// ── API Rate Limiter ─────────────────────────────────────────
// General limit for all other API routes
const apiLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,  // 15 minutes
  max:             100,              // Max 100 requests
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── Verify Rate Limiter ──────────────────────────────────────
// Limit QR scan attempts to prevent abuse
const verifyLimiter = rateLimit({
  windowMs:        5 * 60 * 1000,   // 5 minutes
  max:             20,              // Max 20 scans
  message: {
    success: false,
    message: 'Too many scan attempts. Please wait 5 minutes.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
});

module.exports = { authLimiter, apiLimiter, verifyLimiter };