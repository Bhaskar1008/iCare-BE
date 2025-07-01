import type { Request, Response } from 'express';
import type { IAccessControl } from '@/models/access-control.model';
import type { ModuleConfigDto } from '../dto/create-access-control.dto';

export interface IAccessControlController {
  getAccessControlsByProjectAndChannel(
    req: Request,
    res: Response,
  ): Promise<void>;
  createOrUpdateAccessControl(req: Request, res: Response): Promise<void>;
}

export interface IAccessControlService {
  getOrCreateDefaultAccessControl(
    projectId: string,
    channelId: string,
  ): Promise<IAccessControl>;
  createOrUpdateAccessControl(
    projectId: string,
    channelId: string,
    moduleConfigs: ModuleConfigDto[],
  ): Promise<IAccessControl>;
}

export interface IAccessControlRepository {
  findByProjectAndChannel(
    projectId: string,
    channelId: string,
  ): Promise<IAccessControl | null>;
  createOrUpdateAccessControl(
    projectId: string,
    channelId: string,
    moduleConfigs: ModuleConfigDto[],
  ): Promise<IAccessControl>;
}
