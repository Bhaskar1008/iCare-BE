import type { Request, Response } from 'express';
import type { FilterQuery } from 'mongoose';
import type { CreateHierarchyDto } from '../dto/create-hierarchy.dto';
import type { UpdateHierarchyDto } from '../dto/update-hierarchy.dto';
import type { HierarchyResponseDto } from '../dto/hierarchy-response.dto';
import type { IHierarchy } from '@/models/hierarchy.model';

export interface HierarchyListResponseDto {
  hierarchies: HierarchyResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface HierarchyFilterDto {
  channelId?: string;
  hierarchyLevel?: number;
  hierarchyStatus?: 'active' | 'inactive';
  hierarchyParentId?: string;
}

export interface HierarchyPaginationQueryDto {
  page?: number;
  limit?: number;
  channelId?: string;
  hierarchyLevel?: number;
  hierarchyStatus?: 'active' | 'inactive';
  search?: string;
}

export interface IHierarchyService {
  createHierarchy(data: CreateHierarchyDto): Promise<HierarchyResponseDto>;
  getHierarchyById(id: string): Promise<HierarchyResponseDto | null>;
  getHierarchiesByChannel(channelId: string): Promise<HierarchyResponseDto[]>;
  getHierarchiesByChannelAndLevel(
    channelId: string,
    level: number,
  ): Promise<HierarchyResponseDto[]>;
  getRootHierarchies(channelId: string): Promise<HierarchyResponseDto[]>;
  getChildHierarchies(parentId: string): Promise<HierarchyResponseDto[]>;
  getAllHierarchies(
    page?: number,
    limit?: number,
    channelId?: string,
    level?: number,
    status?: 'active' | 'inactive',
  ): Promise<HierarchyListResponseDto>;
  getHierarchyTeamMemberList(
    channelId: string,
    userId: string,
    isTeamMembers: boolean,
  ): Promise<unknown[]>;
  updateHierarchy(
    id: string,
    data: UpdateHierarchyDto,
  ): Promise<HierarchyResponseDto | null>;
  deleteHierarchy(id: string): Promise<boolean>;
}

export interface IHierarchyController {
  createHierarchy(req: Request, res: Response): Promise<void>;
  getHierarchyById(req: Request, res: Response): Promise<void>;
  getHierarchiesByChannel(req: Request, res: Response): Promise<void>;
  getHierarchiesByChannelAndLevel(req: Request, res: Response): Promise<void>;
  getRootHierarchies(req: Request, res: Response): Promise<void>;
  getChildHierarchies(req: Request, res: Response): Promise<void>;
  getAllHierarchies(req: Request, res: Response): Promise<void>;
  getHierarchyTeamMemberList(req: Request, res: Response): Promise<void>;
  updateHierarchy(req: Request, res: Response): Promise<void>;
  deleteHierarchy(req: Request, res: Response): Promise<void>;
}

export interface IHierarchyRepository {
  findByChannel(channelId: string): Promise<IHierarchy[]>;
  findByChannelAndLevel(
    channelId: string,
    level: number,
  ): Promise<IHierarchy[]>;
  findChildren(parentId: string): Promise<IHierarchy[]>;
  findRootHierarchies(channelId: string): Promise<IHierarchy[]>;
  findByLevelCode(
    channelId: string,
    levelCode: string,
  ): Promise<IHierarchy | null>;
  findWithPagination(
    filter?: FilterQuery<IHierarchy>,
    page?: number,
    limit?: number,
  ): Promise<{
    hierarchies: IHierarchy[];
    total: number;
    totalPages: number;
  }>;
}

export interface HierarchyValidationResult {
  isValid: boolean;
  message: string;
}

export interface HierarchyTreeNode {
  hierarchy: HierarchyResponseDto;
  children: HierarchyTreeNode[];
  depth: number;
  hasChildren: boolean;
}

export interface HierarchyStats {
  totalHierarchies: number;
  hierarchiesByLevel: Record<number, number>;
  hierarchiesByStatus: Record<string, number>;
  hierarchiesByChannel: Record<string, number>;
}

export interface HierarchyPathItem {
  id: string;
  hierarchyName: string;
  hierarchyLevelCode: string;
  hierarchyLevel: number;
}

export interface HierarchyPath {
  items: HierarchyPathItem[];
  depth: number;
  isComplete: boolean;
}
