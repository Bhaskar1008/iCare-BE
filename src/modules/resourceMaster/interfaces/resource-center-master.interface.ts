import type { Request, Response } from 'express';
import type { IResourceCenterMaster } from '@/models/resource-center-master.model';
import type { CreateResourceCenterMasterDto } from '../dto/create-resource-center-master.dto';
import type { UpdateResourceCenterMasterDto } from '../dto/update-resource-center-master.dto';

export interface IResourceCenterMasterService {
  createResourceCenterMaster(
    data: CreateResourceCenterMasterDto,
  ): Promise<IResourceCenterMaster>;
  getAllResourceCenterMasters(): Promise<IResourceCenterMaster[]>;
  updateResourceCenterMaster(
    id: string,
    data: UpdateResourceCenterMasterDto,
  ): Promise<IResourceCenterMaster | null>;
  generateCategoryId(): Promise<string>;
}

export interface IResourceCenterMasterController {
  createResourceCenterMaster(req: Request, res: Response): Promise<void>;
  getAllResourceCenterMasters(req: Request, res: Response): Promise<void>;
  updateResourceCenterMaster(req: Request, res: Response): Promise<void>;
}

export interface IResourceCenterMasterRepository {
  createResourceCenterMaster(
    data: CreateResourceCenterMasterDto & { categoryId: string },
  ): Promise<IResourceCenterMaster>;
  getAllResourceCenterMasters(): Promise<IResourceCenterMaster[]>;
  updateResourceCenterMaster(
    id: string,
    data: UpdateResourceCenterMasterDto,
  ): Promise<IResourceCenterMaster | null>;
  findCategoryIdExists(categoryId: string): Promise<boolean>;
}
