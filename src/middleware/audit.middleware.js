import { logger } from '../utils/logger.js';

export const auditMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  const requestLog = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user?._id,
  };

  // Override response.end to log response
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    const responseLog = {
      ...requestLog,
      statusCode: res.statusCode,
      responseTime,
    };

    logger.info(responseLog, 'API Request');
    
    res.end = originalEnd;
    res.end(chunk, encoding);
  };

  next();
};