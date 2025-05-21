import { logger } from '../utils/logger.js';

const metrics = {
  requestCount: 0,
  errorCount: 0,
  responseTimeTotal: 0,
  statusCodes: {},
  endpoints: {},
};

export const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Increment request count
  metrics.requestCount++;
  
  // Track endpoint usage
  const endpoint = `${req.method} ${req.route?.path || req.path}`;
  metrics.endpoints[endpoint] = (metrics.endpoints[endpoint] || 0) + 1;

  // Override response.end to collect metrics
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    // Update metrics
    metrics.responseTimeTotal += responseTime;
    metrics.statusCodes[res.statusCode] = (metrics.statusCodes[res.statusCode] || 0) + 1;
    
    if (res.statusCode >= 400) {
      metrics.errorCount++;
    }

    res.end = originalEnd;
    res.end(chunk, encoding);
  };

  next();
};

export const getMetrics = () => {
  const avgResponseTime = metrics.responseTimeTotal / metrics.requestCount;
  
  return {
    requestCount: metrics.requestCount,
    errorCount: metrics.errorCount,
    errorRate: (metrics.errorCount / metrics.requestCount) * 100,
    avgResponseTime,
    statusCodes: metrics.statusCodes,
    endpoints: metrics.endpoints,
  };
};