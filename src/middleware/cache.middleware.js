import { logger } from '../utils/logger.js';

const cache = new Map();
const DEFAULT_TTL = 300; // 5 minutes in seconds

export const cacheMiddleware = (ttl = DEFAULT_TTL) => {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl;
    const cachedResponse = cache.get(key);

    if (cachedResponse && cachedResponse.expiry > Date.now()) {
      logger.debug({ key }, 'Cache hit');
      return res.json(cachedResponse.data);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function (data) {
      if (res.statusCode === 200) {
        cache.set(key, {
          data,
          expiry: Date.now() + (ttl * 1000)
        });
        logger.debug({ key }, 'Cache set');
      }
      
      res.json = originalJson;
      return res.json(data);
    };

    next();
  };
};

export const clearCache = (pattern) => {
  if (pattern) {
    for (const [key] of cache.entries()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
  
  logger.info({ pattern }, 'Cache cleared');
};