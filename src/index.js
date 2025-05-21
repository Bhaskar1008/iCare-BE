import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { authRoutes } from './routes/auth.routes.js';
import { leadRoutes } from './routes/lead.routes.js';
import { uploadRoutes } from './routes/upload.routes.js';
import { 
  securityHeaders, 
  corsOptions, 
  requestSizeLimiter,
  sqlInjectionProtection,
  ipFilter,
  sanitizeRequest
} from './middleware/security.middleware.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.middleware.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { auditMiddleware } from './middleware/audit.middleware.js';
import { metricsMiddleware } from './middleware/metrics.middleware.js';
import { cacheMiddleware } from './middleware/cache.middleware.js';
import { kafkaService } from './services/kafka.service.js';

const app = express();

// Security middleware
app.use(ipFilter);
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(requestSizeLimiter);
app.use(sqlInjectionProtection);
app.use(sanitizeRequest);

// Monitoring middleware
app.use(auditMiddleware);
app.use(metricsMiddleware);

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

// Cache middleware for GET requests
app.use(cacheMiddleware());

// Connect to MongoDB
mongoose.connect(config.mongoUri)
  .then(() => logger.info('Connected to MongoDB'))
  .catch((error) => logger.error({ error }, 'MongoDB connection error'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint with enhanced metrics
app.get('/health', (req, res) => {
  const metrics = getMetrics();
  res.json({ 
    status: 'ok', 
    environment: config.env,
    kafka: config.kafka.enabled ? 'enabled' : 'disabled',
    metrics
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  logger.info({ 
    port: config.port, 
    env: config.env,
    kafka: config.kafka.enabled ? 'enabled' : 'disabled'
  }, 'Server started');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Starting graceful shutdown...');
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    // Disconnect from Kafka if enabled
    if (config.kafka.enabled) {
      await kafkaService.disconnect();
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
    
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught exception');
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error({ error }, 'Unhandled rejection');
  process.exit(1);
});