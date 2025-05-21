import { logger } from '../utils/logger.js';

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = null;
  }

  isOpen() {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker state changed to HALF_OPEN');
      }
    }
    return this.state === 'OPEN';
  }

  recordSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.failureCount = 0;
      logger.info('Circuit breaker state changed to CLOSED');
    }
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.warn('Circuit breaker state changed to OPEN');
    }
  }
}

const breakers = new Map();

export const circuitBreakerMiddleware = (service) => {
  if (!breakers.has(service)) {
    breakers.set(service, new CircuitBreaker());
  }

  return (req, res, next) => {
    const breaker = breakers.get(service);

    if (breaker.isOpen()) {
      logger.warn({ service }, 'Circuit breaker is open, request rejected');
      return res.status(503).json({
        message: 'Service temporarily unavailable',
      });
    }

    // Override response handlers to track circuit state
    res.on('finish', () => {
      if (res.statusCode >= 500) {
        breaker.recordFailure();
      } else {
        breaker.recordSuccess();
      }
    });

    next();
  };
};