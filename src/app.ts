import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express';
import type { Server } from 'http';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import type { IAppConfig } from '@/common/interfaces/app.interface';
import { DatabaseProvider } from '@/providers/database.provider';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec, swaggerUiOptions } from '@/config/swagger';
import { configurePassport } from '@/config/passport';
import logger from '@/common/utils/logger';
import { requestLogger } from '@/middleware/requestLogger';
import userRoutes from '@/modules/user/user.routes';
import channelRoutes from '@/modules/channel/channel.routes';
import hierarchyRoutes from '@/modules/hierarchy/hierarchy.routes';
import roleRoutes from '@/modules/role/role.routes';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import eventRoutes from '@/modules/event/event.routes';
import taskRoutes from '@/modules/task/task.routes';
import permissionResourceRoutes from '@/modules/permissionResources/permissionResource.routes';
import permissionRoutes from '@/modules/permission/permission.routes';
import designationRoutes from '@/modules/designation/designation.routes';
import authRoutes from '@/modules/auth/auth.routes';
import agentRoutes from '@/modules/agent/agent.routes';
import leadRoutes from '@/modules/lead/lead.routes';
import provinceRoutes from '@/modules/province/province.routes';
import businessCommitmentRoutes from '@/modules/business-commitment/business-commitment.routes';
import aobRoutes from '@/modules/aob/aob.routes';
import productCategoryRoutes from '@/modules/product-category/product-category.routes';
import productRoutes from '@/modules/product/product.routes';
import utilityRoutes from '@/modules/utility/utility.routes';
import projectRoutes from '@/modules/project/project.routes';
import moduleRoutes from '@/modules/module/module.routes';
import cookieParser from 'cookie-parser';

// Session constants
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MILLISECONDS_PER_SECOND = 1000;

const ONE_DAY_IN_SECONDS =
  HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE;
const ONE_DAY_IN_MS = ONE_DAY_IN_SECONDS * MILLISECONDS_PER_SECOND;
const TEN_MINUTES = 10;

export class App {
  private app: Express;
  private server: Server | null = null;
  private config: IAppConfig;
  private databaseProvider: DatabaseProvider;
  private readonly SESSION_SECRET =
    process.env.SESSION_SECRET ?? 'your-very-secure-session-secret-key-12345';

  constructor(config: IAppConfig) {
    this.config = config;
    this.app = express();
    this.databaseProvider = new DatabaseProvider(config.database);
    this.initializeMiddlewares();
    this.initializePassport();
    this.initializeSwagger();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    this.app.use(
      cors({
        origin: this.config.corsOrigin ?? '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        credentials: true,
      }),
    );
    this.app.use(requestLogger);
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());

    this.app.use(
      session({
        secret: this.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
          mongoUrl: this.config.database.uri,
          dbName: this.config.database.dbName,
          collectionName: 'sessions',
          ttl: ONE_DAY_IN_SECONDS,
          autoRemove: 'interval',
          autoRemoveInterval: TEN_MINUTES,
          touchAfter: ONE_DAY_IN_SECONDS,
        }),
        cookie: {
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
          maxAge: ONE_DAY_IN_MS,
          sameSite: 'lax',
        },
      }),
    );
  }

  private initializePassport(): void {
    configurePassport();
    this.app.use(passport.initialize());
    this.app.use(passport.session());
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

    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/channels', channelRoutes);
    this.app.use('/api/hierarchies', hierarchyRoutes);
    this.app.use('/api/roles', roleRoutes);
    this.app.use('/api/events', eventRoutes);
    this.app.use('/api/task', taskRoutes);
    this.app.use('/api/permissions', permissionRoutes);
    this.app.use('/api/permission-resources', permissionResourceRoutes);
    this.app.use('/api/designations', designationRoutes);
    this.app.use('/api/agents', agentRoutes);
    this.app.use('/api/leads', leadRoutes);
    this.app.use('/api/provinces', provinceRoutes);
    this.app.use('/api/business-commitments', businessCommitmentRoutes);
    this.app.use('/api/aobDocumentMaster', aobRoutes);
    this.app.use('/api/aob', aobRoutes);
    this.app.use('/api/product-categories', productCategoryRoutes);
    this.app.use('/api/products', productRoutes);
    this.app.use('/api/utility', utilityRoutes);
    this.app.use('/api/projects', projectRoutes);
    this.app.use('/api/modules', moduleRoutes);

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
