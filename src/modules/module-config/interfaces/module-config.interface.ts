import type { Request, Response } from 'express';
import type { CreateModuleConfigDto } from '../dto/create-module-config.dto';
import type { UpdateModuleConfigDto } from '../dto/update-module-config.dto';
import type { ModuleConfigResponseDto } from '../dto/module-config-response.dto';
import type { IModuleConfig } from '@/models/module-config.model';
import type { FilterQuery } from 'mongoose';

export interface IModuleConfigRepository {
  create(data: Partial<IModuleConfig>): Promise<IModuleConfig>;
  findById(id: string): Promise<IModuleConfig | null>;
  findByModuleId(moduleId: string): Promise<IModuleConfig[]>;
  findByProjectId(projectId: string): Promise<IModuleConfig[]>;
  findByModuleIdAndProjectId(
    moduleId: string,
    projectId?: string,
  ): Promise<IModuleConfig[]>;
  findByModuleIdAndConfigName(
    moduleId: string,
    configName: string,
    projectId?: string,
  ): Promise<IModuleConfig | null>;
  findAll(filter?: FilterQuery<IModuleConfig>): Promise<IModuleConfig[]>;
  update(
    id: string,
    data: Partial<IModuleConfig>,
  ): Promise<IModuleConfig | null>;
  delete(id: string): Promise<boolean>;
}

export interface IModuleConfigService {
  createModuleConfig(
    data: CreateModuleConfigDto,
  ): Promise<ModuleConfigResponseDto>;
  getModuleConfigById(id: string): Promise<ModuleConfigResponseDto | null>;
  getModuleConfigsByModuleId(
    moduleId: string,
  ): Promise<ModuleConfigResponseDto[]>;
  getModuleConfigsByProjectId(
    projectId: string,
  ): Promise<ModuleConfigResponseDto[]>;
  getModuleConfigsByModuleIdAndProjectId(
    moduleId: string,
    projectId?: string,
  ): Promise<ModuleConfigResponseDto[]>;
  getModuleConfigByModuleIdAndName(
    moduleId: string,
    configName: string,
    projectId?: string,
  ): Promise<ModuleConfigResponseDto | null>;
  getAllModuleConfigs(
    filter?: FilterQuery<IModuleConfig>,
  ): Promise<ModuleConfigResponseDto[]>;
  updateModuleConfig(
    id: string,
    data: UpdateModuleConfigDto,
  ): Promise<ModuleConfigResponseDto | null>;
  deleteModuleConfig(id: string): Promise<boolean>;
}

export interface IModuleConfigController {
  createModuleConfig(req: Request, res: Response): Promise<void>;
  getModuleConfigById(req: Request, res: Response): Promise<void>;
  getModuleConfigsByModuleId(req: Request, res: Response): Promise<void>;
  getModuleConfigsByProjectId(req: Request, res: Response): Promise<void>;
  getModuleConfigsByModuleIdAndProjectId(
    req: Request,
    res: Response,
  ): Promise<void>;
  getModuleConfigByModuleIdAndName(req: Request, res: Response): Promise<void>;
  getAllModuleConfigs(req: Request, res: Response): Promise<void>;
  updateModuleConfig(req: Request, res: Response): Promise<void>;
  deleteModuleConfig(req: Request, res: Response): Promise<void>;
}
