import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express';
import type { Server } from 'http';
import type { IAppConfig } from '@/common/interfaces/app.interface';
import { DatabaseProvider } from '@/providers/database.provider';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec, swaggerUiOptions } from '@/config/swagger';
import logger from '@/common/utils/logger';
import { requestLogger } from '@/middleware/requestLogger';
import userRoutes from '@/modules/user/user.routes';
import leadConfigRoutes from '@/modules/lead-config/lead-config.routes';
import leadRoutes from '@/modules/lead/lead.routes';
import channelRoutes from '@/modules/channel/channel.routes';
import hierarchyRoutes from '@/modules/hierarchy/hierarchy.routes';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import eventRoutes from '@/modules/event/event.routes';
import taskRoutes from './modules/task/task.routes';

export class App {
  private app: Express;
  private server: Server | null = null;
  private config: IAppConfig;
  private databaseProvider: DatabaseProvider;

  constructor(config: IAppConfig) {
    this.config = config;
    this.app = express();
    this.databaseProvider = new DatabaseProvider(config.database);
    this.initializeMiddlewares();
    this.initializeSwagger();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    this.app.use(requestLogger);
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private initializeSwagger(): void {
    this.app.use(
      '/docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, swaggerUiOptions),
    );
  }

  private initializeRoutes(): void {
    this.app.use('/health', (req: Request, res: Response) => {
      const dbHealth = this.databaseProvider.getHealth();
      res.status(HTTP_STATUS.OK).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbHealth,
      });
    });

    this.app.use('/health/database', (req: Request, res: Response) => {
      const health = this.databaseProvider.getHealth();
      const statusCode =
        health.status === 'connected'
          ? HTTP_STATUS.OK
          : HTTP_STATUS.SERVICE_UNAVAILABLE;

      res.status(statusCode).json({
        ...health,
        timestamp: new Date().toISOString(),
      });
    });

    this.app.use('/api/users', userRoutes);
    this.app.use('/api/lead-config', leadConfigRoutes);
    this.app.use('/api/leads', leadRoutes);
    this.app.use('/api/channels', channelRoutes);
    this.app.use('/api/hierarchies', hierarchyRoutes);
    this.app.use('/api/events', eventRoutes);
    this.app.use('/api/task', taskRoutes);

    this.app.use((req: Request, res: Response) => {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(
      (err: Error, req: Request, res: Response, _next: NextFunction) => {
        logger.error('Unhandled error:', {
          error: err.message,
          stack: err.stack,
          path: req.path,
          method: req.method,
          ip: req.ip,
        });

        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          status: 'error',
          message: 'Internal server error',
        });
      },
    );
  }

  public async start(): Promise<void> {
    try {
      await this.databaseProvider.connect();

      return new Promise(resolve => {
        this.server = this.app.listen(this.config.port, () => {
          logger.info(`Server is running on port ${this.config.port}`);
          logger.info(
            `Swagger documentation available at http://localhost:${this.config.port}/docs`,
          );
          logger.info(
            `User API available at http://localhost:${this.config.port}/api/users`,
          );
          logger.info(
            `Channel API available at http://localhost:${this.config.port}/api/channels`,
          );
          logger.info(
            `Hierarchy API available at http://localhost:${this.config.port}/api/hierarchies`,
          );
          resolve();
        });
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to start application:', {
        error: err.message,
        stack: err.stack,
      });
      throw err;
    }
  }

  public async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      const promises: Promise<void>[] = [];

      if (this.databaseProvider.isConnected()) {
        promises.push(this.databaseProvider.disconnect());
      }

      if (this.server) {
        promises.push(
          new Promise<void>((serverResolve, serverReject) => {
            this.server!.close(err => {
              if (err) {
                serverReject(err);
                return;
              }
              serverResolve();
            });
          }),
        );
      }

      Promise.all(promises)
        .then(() => resolve())
        .catch(reject);
    });
  }

  public getApp(): Express {
    return this.app;
  }

  public getDatabaseProvider(): DatabaseProvider {
    return this.databaseProvider;
  }
}
