import type { IDatabaseConfig } from '@/common/interfaces/database.interface';
import { DATABASE_TIMEOUTS } from '@/common/constants/http-status.constants';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_DB_NAME = 'salesverse-dev';
const DEFAULT_MONGO_URI = 'mongodb://localhost:27017';

export const getDatabaseConfig = (): IDatabaseConfig => {
  const mongoUri = process.env.MONGODB_URI ?? DEFAULT_MONGO_URI;
  const dbName = process.env.MONGODB_DB_NAME ?? DEFAULT_DB_NAME;

  return {
    uri: mongoUri,
    dbName,
    options: {
      maxPoolSize: process.env.MONGODB_MAX_POOL_SIZE
        ? parseInt(
            process.env.MONGODB_MAX_POOL_SIZE,
            DATABASE_TIMEOUTS.MAX_POOL_SIZE,
          )
        : DATABASE_TIMEOUTS.MAX_POOL_SIZE,
      minPoolSize: process.env.MONGODB_MIN_POOL_SIZE
        ? parseInt(
            process.env.MONGODB_MIN_POOL_SIZE,
            DATABASE_TIMEOUTS.MAX_POOL_SIZE,
          )
        : DATABASE_TIMEOUTS.MIN_POOL_SIZE,
      maxIdleTimeMS: process.env.MONGODB_MAX_IDLE_TIME_MS
        ? parseInt(
            process.env.MONGODB_MAX_IDLE_TIME_MS,
            DATABASE_TIMEOUTS.MAX_POOL_SIZE,
          )
        : DATABASE_TIMEOUTS.MAX_IDLE_TIME_MS,
      serverSelectionTimeoutMS: process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS
        ? parseInt(
            process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
            DATABASE_TIMEOUTS.MAX_POOL_SIZE,
          )
        : DATABASE_TIMEOUTS.SERVER_SELECTION_TIMEOUT_MS,
      socketTimeoutMS: process.env.MONGODB_SOCKET_TIMEOUT_MS
        ? parseInt(
            process.env.MONGODB_SOCKET_TIMEOUT_MS,
            DATABASE_TIMEOUTS.MAX_POOL_SIZE,
          )
        : DATABASE_TIMEOUTS.SOCKET_TIMEOUT_MS,
      connectTimeoutMS: process.env.MONGODB_CONNECT_TIMEOUT_MS
        ? parseInt(
            process.env.MONGODB_CONNECT_TIMEOUT_MS,
            DATABASE_TIMEOUTS.MAX_POOL_SIZE,
          )
        : DATABASE_TIMEOUTS.CONNECT_TIMEOUT_MS,
      retryWrites: process.env.MONGODB_RETRY_WRITES !== 'false',
      retryReads: process.env.MONGODB_RETRY_READS !== 'false',
    },
  };
};
