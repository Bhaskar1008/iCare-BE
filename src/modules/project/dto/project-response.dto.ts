import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsObject,
  IsDate,
} from 'class-validator';
import type { IProject } from '@/models/project.model';
import type { IModule } from '@/models/module.model';
import type { Types } from 'mongoose';

class ModuleDetailsDto {
  @IsString()
  name: string = '';

  @IsString()
  code: string = '';

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  version: string = '';

  @IsBoolean()
  isCore: boolean = false;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}

class ModuleResponseDto {
  @IsString()
  moduleId: string = '';

  @IsOptional()
  @Type(() => ModuleDetailsDto)
  moduleDetails?: ModuleDetailsDto;

  @IsBoolean()
  isActive: boolean = true;

  @IsObject()
  config: Record<string, unknown> = {};
}

export class ProjectResponseDto {
  @IsString()
  id: string = '';

  @IsString()
  projectName: string = '';

  @IsString()
  projectCode: string = '';

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @Type(() => ModuleResponseDto)
  modules: ModuleResponseDto[] = [];

  @IsString()
  projectStatus: string = '';

  @IsDate()
  @Type(() => Date)
  createdAt: Date = new Date();

  @IsDate()
  @Type(() => Date)
  updatedAt: Date = new Date();

  constructor(project: IProject) {
    this.id = project._id.toString();
    this.projectName = project.projectName;
    this.projectCode = project.projectCode;
    this.description = project.description;
    this.modules = project.modules.map(module => ({
      moduleId: this.getModuleId(module.moduleId),
      moduleDetails: this.isModuleObject(module.moduleId)
        ? {
            name: module.moduleId.name,
            code: module.moduleId.code,
            description: module.moduleId.description,
            version: module.moduleId.version,
            isCore: module.moduleId.isCore,
            permissions: module.moduleId.permissions,
          }
        : undefined,
      isActive: module.isActive,
      config: module.config as Record<string, unknown>,
    }));
    this.projectStatus = project.projectStatus;
    this.createdAt = project.createdAt;
    this.updatedAt = project.updatedAt;
  }

  private getModuleId(moduleId: Types.ObjectId | IModule): string {
    return this.isModuleObject(moduleId)
      ? moduleId._id.toString()
      : moduleId.toString();
  }

  private isModuleObject(
    moduleId: Types.ObjectId | IModule,
  ): moduleId is IModule {
    return moduleId instanceof Object && 'name' in moduleId;
  }
}
