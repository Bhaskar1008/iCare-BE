import type { Request, Response } from 'express';
import type { CreateRoleDto } from '../dto/create-role.dto';
import type { UpdateRoleDto } from '../dto/update-role.dto';
import type { RoleResponseDto } from '../dto/role-response.dto';
import type { IRole } from '@/models/role.model';
import type { FilterQuery } from 'mongoose';

export interface IRoleRepository {
  create(data: Partial<IRole>): Promise<IRole>;
  findById(id: string): Promise<IRole | null>;
  findByCode(code: string | number, channelId?: string): Promise<IRole | null>;
  findByName(name: string, channelId?: string): Promise<IRole | null>;
  findByChannelId(channelId: string): Promise<IRole[]>;
  findActiveRoles(channelId?: string): Promise<IRole[]>;
  findSystemRoles(): Promise<IRole[]>;
  findWithPagination(
    filter?: FilterQuery<IRole>,
    page?: number,
    limit?: number,
  ): Promise<{ roles: IRole[]; total: number; totalPages: number }>;
  updateById(id: string, data: Partial<IRole>): Promise<IRole | null>;
  deleteById(id: string): Promise<IRole | null>;
}

export interface IRoleService {
  createRole(data: CreateRoleDto): Promise<RoleResponseDto>;
  getRoleById(id: string): Promise<RoleResponseDto | null>;
  getRoleByCode(
    code: string | number,
    channelId?: string,
  ): Promise<RoleResponseDto | null>;
  getRolesByChannelId(channelId: string): Promise<RoleResponseDto[]>;
  getAllRoles(
    page?: number,
    limit?: number,
    status?: 'active' | 'inactive',
    channelId?: string,
    search?: string,
    isSystem?: boolean,
  ): Promise<{
    roles: RoleResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;
  getActiveRoles(channelId?: string): Promise<RoleResponseDto[]>;
  getSystemRoles(): Promise<RoleResponseDto[]>;
  updateRole(id: string, data: UpdateRoleDto): Promise<RoleResponseDto | null>;
  deleteRole(id: string): Promise<boolean>;
}

export interface IRoleController {
  createRole(req: Request, res: Response): Promise<void>;
  getRoleById(req: Request, res: Response): Promise<void>;
  getRoleByCode(req: Request, res: Response): Promise<void>;
  getRolesByChannelId(req: Request, res: Response): Promise<void>;
  getAllRoles(req: Request, res: Response): Promise<void>;
  getActiveRoles(req: Request, res: Response): Promise<void>;
  getSystemRoles(req: Request, res: Response): Promise<void>;
  updateRole(req: Request, res: Response): Promise<void>;
  deleteRole(req: Request, res: Response): Promise<void>;
}
