import mongoose from 'mongoose';
import type { Connection } from 'mongoose';
import type {
  IDatabaseConfig,
  IDatabaseProvider,
  IDatabaseHealth,
} from '@/common/interfaces/database.interface';
import {
  DatabaseConnectionException,
  DatabaseOperationException,
} from '@/common/exceptions/database.exception';
import { CONNECTION_STATES } from '@/common/constants/http-status.constants';
import logger from '@/common/utils/logger';

export class DatabaseProvider implements IDatabaseProvider {
  private config: IDatabaseConfig;
  private connection: Connection | null = null;
  private connectionStartTime: number = 0;

  constructor(config: IDatabaseConfig) {
    this.config = config;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    mongoose.connection.on('connected', () => {
      this.connectionStartTime = Date.now();
      logger.info('MongoDB connected successfully', {
        database: this.config.dbName,
        host: this.getHostFromUri(this.config.uri),
      });
    });

    mongoose.connection.on('error', (error: Error) => {
      logger.error('MongoDB connection error:', {
        error: error.message,
        stack: error.stack,
        database: this.config.dbName,
      });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected', {
        database: this.config.dbName,
        uptime: this.getUptime(),
      });
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected', {
        database: this.config.dbName,
      });
    });

    mongoose.connection.on('close', () => {
      logger.info('MongoDB connection closed', {
        database: this.config.dbName,
        uptime: this.getUptime(),
      });
    });
  }

  public async connect(): Promise<void> {
    try {
      if (this.isConnected()) {
        logger.warn('MongoDB already connected');
        return;
      }

      logger.info('Connecting to MongoDB...', {
        database: this.config.dbName,
        host: this.getHostFromUri(this.config.uri),
      });

      await mongoose.connect(this.config.uri, {
        dbName: this.config.dbName,
        ...this.config.options,
      });

      this.connection = mongoose.connection;

      logger.info('MongoDB connection established successfully', {
        database: this.config.dbName,
        readyState: this.getConnectionState(),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to connect to MongoDB:', {
        error: err.message,
        stack: err.stack,
        database: this.config.dbName,
        host: this.getHostFromUri(this.config.uri),
      });

      throw new DatabaseConnectionException(
        `Failed to connect to MongoDB: ${err.message}`,
      );
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (!this.isConnected()) {
        logger.warn('MongoDB already disconnected');
        return;
      }

      logger.info('Disconnecting from MongoDB...', {
        database: this.config.dbName,
        uptime: this.getUptime(),
      });

      await mongoose.disconnect();
      this.connection = null;

      logger.info('MongoDB disconnected successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error during MongoDB disconnection:', {
        error: err.message,
        stack: err.stack,
      });

      throw new DatabaseOperationException(
        `Failed to disconnect from MongoDB: ${err.message}`,
      );
    }
  }

  public isConnected(): boolean {
    return (
      Number(mongoose.connection.readyState) ===
      Number(CONNECTION_STATES.CONNECTED)
    );
  }

  public getConnectionState(): string {
    const states = {
      [CONNECTION_STATES.DISCONNECTED]: 'disconnected',
      [CONNECTION_STATES.CONNECTED]: 'connected',
      [CONNECTION_STATES.CONNECTING]: 'connecting',
      [CONNECTION_STATES.DISCONNECTING]: 'disconnecting',
    } as const;

    const currentState = mongoose.connection.readyState;
    return states[currentState as keyof typeof states] ?? 'unknown';
  }

  public getHealth(): IDatabaseHealth {
    const connections = {
      current: this.isConnected() ? 1 : 0,
      available: this.isConnected() ? 1 : 0,
    };

    return {
      status: this.getConnectionState() as IDatabaseHealth['status'],
      uptime: this.getUptime(),
      connections,
    };
  }

  public getConnection(): Connection | null {
    return this.connection;
  }

  private getUptime(): number {
    return this.connectionStartTime > 0
      ? Date.now() - this.connectionStartTime
      : 0;
  }

  private getHostFromUri(uri: string): string {
    try {
      const url = new URL(uri);
      return url.host;
    } catch {
      return 'unknown';
    }
  }
}
