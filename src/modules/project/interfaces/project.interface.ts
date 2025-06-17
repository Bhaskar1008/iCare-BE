import type { Request, Response } from 'express';
import type { IProject } from '@/models/project.model';
import type { CreateProjectDto } from '../dto/create-project.dto';
import type { ProjectQueryDto } from '../dto/project-query.dto';

export interface IProjectController {
  createProject(req: Request, res: Response): Promise<void>;
  getProjects(req: Request, res: Response): Promise<void>;
  getProjectById(req: Request, res: Response): Promise<void>;
  updateProject(req: Request, res: Response): Promise<void>;
  deleteProject(req: Request, res: Response): Promise<void>;
}

export interface IProjectService {
  createProject(data: CreateProjectDto): Promise<IProject>;
  getProjects(query: ProjectQueryDto): Promise<{
    projects: IProject[];
    total: number;
    page: number;
    limit: number;
  }>;
  getProjectById(id: string): Promise<IProject>;
  updateProject(id: string, data: Partial<CreateProjectDto>): Promise<IProject>;
  deleteProject(id: string): Promise<void>;
}

export interface IProjectRepository {
  createProject(data: CreateProjectDto): Promise<IProject>;
  findWithPagination(query: ProjectQueryDto): Promise<{
    projects: IProject[];
    total: number;
    page: number;
    limit: number;
  }>;
  findById(id: string): Promise<IProject | null>;
  findByIdAndUpdate(
    id: string,
    data: Partial<CreateProjectDto>,
  ): Promise<IProject | null>;
  findByIdAndDelete(id: string): Promise<void>;
}
