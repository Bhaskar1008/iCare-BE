import type { IDatabaseConfig } from './database.interface';

export interface IAppConfig {
  port: number;
  environment: string;
  database: IDatabaseConfig;
  corsOrigin?: string | string[];
}
