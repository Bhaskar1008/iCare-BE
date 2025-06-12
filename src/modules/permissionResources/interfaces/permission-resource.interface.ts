import type { Request, Response } from 'express';
import type { CreatePermissionResourceDto } from '../dto/create-permission-resource.dto';
import type { UpdatePermissionResourceDto } from '../dto/update-permission-resource.dto';
import type { PermissionResourceResponseDto } from '../dto/permission-resource-response.dto';
import type { IResource } from '@/models/resource.model';
import type { FilterQuery } from 'mongoose';

export interface IPermissionResourceRepository {
  create(data: Partial<IResource>): Promise<IResource>;
  findById(id: string): Promise<IResource | null>;
  findByIdentifier(identifier: string): Promise<IResource | null>;
  findActiveResources(): Promise<IResource[]>;
  findByType(
    type: 'module' | 'api' | 'page' | 'ui' | 'feature',
  ): Promise<IResource[]>;
  findByParentId(parentId: string): Promise<IResource[]>;
  findWithPagination(
    filter?: FilterQuery<IResource>,
    page?: number,
    limit?: number,
  ): Promise<{ resources: IResource[]; total: number; totalPages: number }>;
  update(id: string, data: Partial<IResource>): Promise<IResource | null>;
  delete(id: string): Promise<boolean>;
}

export interface IPermissionResourceService {
  createResource(
    data: CreatePermissionResourceDto,
  ): Promise<PermissionResourceResponseDto>;
  getResourceById(id: string): Promise<PermissionResourceResponseDto | null>;
  getResourceByIdentifier(
    identifier: string,
  ): Promise<PermissionResourceResponseDto | null>;
  getAllResources(
    page?: number,
    limit?: number,
    status?: 'active' | 'inactive',
    type?: 'module' | 'api' | 'page' | 'ui' | 'feature',
    parentId?: string,
    search?: string,
  ): Promise<{
    resources: PermissionResourceResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;
  getActiveResources(): Promise<PermissionResourceResponseDto[]>;
  getResourcesByType(
    type: 'module' | 'api' | 'page' | 'ui' | 'feature',
  ): Promise<PermissionResourceResponseDto[]>;
  getResourcesByParentId(
    parentId: string,
  ): Promise<PermissionResourceResponseDto[]>;
  updateResource(
    id: string,
    data: UpdatePermissionResourceDto,
  ): Promise<PermissionResourceResponseDto | null>;
  deleteResource(id: string): Promise<boolean>;
}

export interface IPermissionResourceController {
  createResource(req: Request, res: Response): Promise<void>;
  getResourceById(req: Request, res: Response): Promise<void>;
  getResourceByIdentifier(req: Request, res: Response): Promise<void>;
  getAllResources(req: Request, res: Response): Promise<void>;
  getActiveResources(req: Request, res: Response): Promise<void>;
  getResourcesByType(req: Request, res: Response): Promise<void>;
  getResourcesByParentId(req: Request, res: Response): Promise<void>;
  updateResource(req: Request, res: Response): Promise<void>;
  deleteResource(req: Request, res: Response): Promise<void>;
}
