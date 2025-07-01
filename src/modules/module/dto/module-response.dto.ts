import { Type } from 'class-transformer';
import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';
import type { IModule, IConfigField } from '@/models/module.model';

export class ModuleResponseDto {
  @IsString()
  _id: string = '';

  @IsString()
  name: string = '';

  @IsString()
  code: string = '';

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  defaultConfig: IConfigField[] = [];

  @IsBoolean()
  isActive: boolean = true;

  @IsBoolean()
  isCore: boolean = false;

  @IsString()
  version: string = '1.0.0';

  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  dependencies: string[] = [];

  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  permissions: string[] = [];

  @IsString()
  createdAt: string = '';

  @IsString()
  updatedAt: string = '';

  constructor(module: IModule) {
    this._id = module._id.toString();
    this.name = module.name;
    this.code = module.code;
    this.description = module.description;
    this.defaultConfig = module.defaultConfig ?? [
      {
        fieldName: 'test',
        fieldType: 'string',
        values: ['test'],
      },
    ];
    this.isActive = module.isActive ?? true;
    this.isCore = module.isCore ?? false;
    this.version = module.version ?? '1.0.0';
    this.dependencies = module.dependencies ?? [];
    this.permissions = module.permissions ?? [];
    this.createdAt = module.createdAt.toISOString();
    this.updatedAt = module.updatedAt.toISOString();
  }
}
