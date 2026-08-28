const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'production' ? 2000 : 20000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' }
});

module.exports = { helmetMiddleware: helmet(), apiLimiter, loginLimiter };
