import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// Content Security Policy configuration
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", config.app.url],
    fontSrc: ["'self'", "https:", "data:"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
};

// Security headers middleware
export const securityHeaders = [
  helmet({
    contentSecurityPolicy: cspConfig,
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: true,
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  }),
];

// CORS configuration
export const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [config.app.url];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 600, // 10 minutes
};

// Request size limiter
export const requestSizeLimiter = (req, res, next) => {
  const MAX_CONTENT_LENGTH = 10 * 1024 * 1024; // 10MB

  if (req.headers['content-length'] > MAX_CONTENT_LENGTH) {
    logger.warn({
      contentLength: req.headers['content-length'],
      maxLength: MAX_CONTENT_LENGTH,
    }, 'Request body too large');
    
    return res.status(413).json({
      message: 'Request entity too large',
    });
  }
  next();
};

// SQL injection protection
export const sqlInjectionProtection = (req, res, next) => {
  const sqlPattern = /(\b(select|insert|update|delete|drop|union|alter)\b)|(['"])/i;
  
  const checkValue = (value) => {
    if (typeof value === 'string' && sqlPattern.test(value)) {
      return true;
    }
    return false;
  };

  const hasSqlInjection = Object.values(req.body).some(checkValue) ||
    Object.values(req.query).some(checkValue) ||
    Object.values(req.params).some(checkValue);

  if (hasSqlInjection) {
    logger.warn({
      ip: req.ip,
      method: req.method,
      url: req.url,
    }, 'Potential SQL injection attempt detected');
    
    return res.status(403).json({
      message: 'Invalid input detected',
    });
  }
  next();
};

// IP blacklist middleware
export const ipFilter = (req, res, next) => {
  const blacklistedIPs = config.security?.blacklistedIPs || [];
  
  if (blacklistedIPs.includes(req.ip)) {
    logger.warn({ ip: req.ip }, 'Blocked request from blacklisted IP');
    return res.status(403).json({
      message: 'Access denied',
    });
  }
  next();
};

// API key validation for external services
export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== config.security.apiKey) {
    logger.warn({
      ip: req.ip,
      method: req.method,
      url: req.url,
    }, 'Invalid API key');
    
    return res.status(401).json({
      message: 'Invalid API key',
    });
  }
  next();
};

// Request sanitizer
export const sanitizeRequest = (req, res, next) => {
  const sanitize = (obj) => {
    for (let prop in obj) {
      if (typeof obj[prop] === 'string') {
        // Remove potentially dangerous characters
        obj[prop] = obj[prop]
          .replace(/[<>]/g, '')
          .trim();
      } else if (typeof obj[prop] === 'object') {
        sanitize(obj[prop]);
      }
    }
  };

  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);

  next();
};