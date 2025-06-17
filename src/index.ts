import { App } from '@/app';
import { getDatabaseConfig } from '@/config/database.config';
import logger from '@/common/utils/logger';

const DEFAULT_PORT = 3000;

const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT,
  environment: process.env.NODE_ENV ?? 'test',
  database: getDatabaseConfig(),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
};

const app = new App(config);

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
  });
  void shutdown();
});

process.on('unhandledRejection', (reason: unknown) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logger.error('Unhandled Rejection:', {
    reason: error.message,
    stack: error.stack,
  });
  void shutdown();
});

const shutdown = async () => {
  logger.info('Shutting down server...');
  try {
    await app.stop();
    process.exit(0);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error during shutdown:', {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
};

process.on('SIGTERM', () => void shutdown());
process.on('SIGINT', () => void shutdown());

void app.start().catch(error => {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error('Failed to start server:', {
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});
