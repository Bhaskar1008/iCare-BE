import type { Request, Response } from 'express';
import type { IModule } from '@/models/module.model';
import type { CreateModuleDto } from '../dto/create-module.dto';
import type { ModuleQueryDto } from '../dto/module-query.dto';

export interface IModuleController {
  createModule(req: Request, res: Response): Promise<void>;
  getModules(req: Request, res: Response): Promise<void>;
  getModuleById(req: Request, res: Response): Promise<void>;
  updateModule(req: Request, res: Response): Promise<void>;
  deleteModule(req: Request, res: Response): Promise<void>;
}

export interface IModuleService {
  createModule(data: CreateModuleDto): Promise<IModule>;
  getModules(query: ModuleQueryDto): Promise<{
    modules: IModule[];
    total: number;
    page: number;
    limit: number;
  }>;
  getModuleById(id: string): Promise<IModule>;
  updateModule(id: string, data: Partial<CreateModuleDto>): Promise<IModule>;
  deleteModule(id: string): Promise<void>;
}

export interface IModuleRepository {
  create(data: CreateModuleDto): Promise<IModule>;
  findWithPagination(query: ModuleQueryDto): Promise<{
    modules: IModule[];
    total: number;
    page: number;
    limit: number;
  }>;
  findById(id: string): Promise<IModule | null>;
  findByIdAndUpdate(
    id: string,
    data: Partial<CreateModuleDto>,
  ): Promise<IModule | null>;
  findByIdAndDelete(id: string): Promise<void>;
}
