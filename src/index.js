import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { authRoutes } from './routes/auth.routes.js';
import { leadRoutes } from './routes/lead.routes.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.middleware.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { kafkaService } from './services/kafka.service.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.app.url,
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

// Connect to MongoDB
mongoose.connect(config.mongoUri)
  .then(() => logger.info('Connected to MongoDB'))
  .catch((error) => logger.error({ error }, 'MongoDB connection error'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    environment: config.env,
    kafka: config.kafka.enabled ? 'enabled' : 'disabled'
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