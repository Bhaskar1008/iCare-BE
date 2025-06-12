import type { Request, Response } from 'express';
import type { CreatePermissionDto } from '../dto/create-permission.dto';
import type { UpdatePermissionDto } from '../dto/update-permission.dto';
import type { PermissionResponseDto } from '../dto/permission-response.dto';
import type { IPermission } from '@/models/permission.model';
import type { FilterQuery } from 'mongoose';

export interface IPermissionRepository {
  create(data: Partial<IPermission>): Promise<IPermission>;
  findById(id: string): Promise<IPermission | null>;
  findByResourceAndAction(
    resourceId: string,
    action: string,
  ): Promise<IPermission | null>;
  findActivePermissions(): Promise<IPermission[]>;
  findByResourceId(resourceId: string): Promise<IPermission[]>;
  findWithPagination(
    filter?: FilterQuery<IPermission>,
    page?: number,
    limit?: number,
  ): Promise<{ permissions: IPermission[]; total: number; totalPages: number }>;
  update(id: string, data: Partial<IPermission>): Promise<IPermission | null>;
  delete(id: string): Promise<boolean>;
}

export interface IPermissionService {
  createPermission(data: CreatePermissionDto): Promise<PermissionResponseDto>;
  getPermissionById(id: string): Promise<PermissionResponseDto | null>;
  getPermissionsByResourceId(
    resourceId: string,
  ): Promise<PermissionResponseDto[]>;
  getAllPermissions(
    page?: number,
    limit?: number,
    status?: 'active' | 'inactive',
    effect?: 'allow' | 'deny',
    resourceId?: string,
    action?: string,
  ): Promise<{
    permissions: PermissionResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;
  getActivePermissions(): Promise<PermissionResponseDto[]>;
  updatePermission(
    id: string,
    data: UpdatePermissionDto,
  ): Promise<PermissionResponseDto | null>;
  deletePermission(id: string): Promise<boolean>;
}

export interface IPermissionController {
  createPermission(req: Request, res: Response): Promise<void>;
  getPermissionById(req: Request, res: Response): Promise<void>;
  getPermissionsByResourceId(req: Request, res: Response): Promise<void>;
  getAllPermissions(req: Request, res: Response): Promise<void>;
  getActivePermissions(req: Request, res: Response): Promise<void>;
  updatePermission(req: Request, res: Response): Promise<void>;
  deletePermission(req: Request, res: Response): Promise<void>;
}
