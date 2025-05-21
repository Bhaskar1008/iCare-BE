import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests, please try again later' },
  handler: (req, res) => {
    logger.warn({
      ip: req.ip,
      method: req.method,
      url: req.url,
    }, 'Rate limit exceeded');
    
    res.status(429).json({ message: 'Too many requests, please try again later' });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 failed login attempts per hour
  message: { message: 'Too many login attempts, please try again later' },
  handler: (req, res) => {
    logger.warn({
      ip: req.ip,
      method: req.method,
      url: req.url,
    }, 'Auth rate limit exceeded');
    
    res.status(429).json({ message: 'Too many login attempts, please try again later' });
  },
  standardHeaders: true,
  legacyHeaders: false,
});