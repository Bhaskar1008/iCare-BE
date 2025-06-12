import type { Request, Response } from 'express';
import type { CreateDesignationDto } from '@/modules/designation/dto/create-designation.dto';
import type { IDesignation } from '@/models/designation.model';
import type { FilterQuery } from 'mongoose';
import type { DesignationResponseDto } from '@/modules/designation/dto/designation-response.dto';

export interface IDesignationRepository {
  create(data: Partial<IDesignation>): Promise<IDesignation>;
  findById(id: string, populate?: boolean): Promise<IDesignation | null>;
  findByCode(
    code: string,
    channelId: string,
    populate?: boolean,
  ): Promise<IDesignation | null>;
  findActiveDesignations(populate?: boolean): Promise<IDesignation[]>;
  findByChannelId(
    channelId: string,
    populate?: boolean,
  ): Promise<IDesignation[]>;
  findByHierarchyId(
    hierarchyId: string,
    populate?: boolean,
  ): Promise<IDesignation[]>;
  findByRoleId(roleId: string, populate?: boolean): Promise<IDesignation[]>;
  findWithPagination(
    filter?: FilterQuery<IDesignation>,
    page?: number,
    limit?: number,
    populate?: boolean,
  ): Promise<{
    designations: IDesignation[];
    total: number;
    totalPages: number;
  }>;
}

export interface IDesignationService {
  createDesignation(
    data: CreateDesignationDto,
  ): Promise<DesignationResponseDto>;
  getDesignationById(
    id: string,
    populate?: boolean,
  ): Promise<DesignationResponseDto | null>;
  getDesignationByCode(
    code: string,
    channelId: string,
    populate?: boolean,
  ): Promise<DesignationResponseDto | null>;
  getAllDesignations(
    page?: number,
    limit?: number,
    status?: 'active' | 'inactive',
    channelId?: string,
    roleId?: string,
    hierarchyId?: string,
    populate?: boolean,
  ): Promise<{
    designations: DesignationResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;
  getActiveDesignations(populate?: boolean): Promise<DesignationResponseDto[]>;
  getDesignationsByChannelId(
    channelId: string,
    populate?: boolean,
  ): Promise<DesignationResponseDto[]>;
  getDesignationsByHierarchyId(
    hierarchyId: string,
    populate?: boolean,
  ): Promise<DesignationResponseDto[]>;
  getDesignationsByRoleId(
    roleId: string,
    populate?: boolean,
  ): Promise<DesignationResponseDto[]>;
}

export interface IDesignationController {
  createDesignation(req: Request, res: Response): Promise<void>;
  getDesignationById(req: Request, res: Response): Promise<void>;
  getDesignationByCode(req: Request, res: Response): Promise<void>;
  getAllDesignations(req: Request, res: Response): Promise<void>;
  getActiveDesignations(req: Request, res: Response): Promise<void>;
  getDesignationsByChannelId(req: Request, res: Response): Promise<void>;
  getDesignationsByHierarchyId(req: Request, res: Response): Promise<void>;
  getDesignationsByRoleId(req: Request, res: Response): Promise<void>;
}
