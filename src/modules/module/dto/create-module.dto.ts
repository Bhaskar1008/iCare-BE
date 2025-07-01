import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { IConfigField } from '@/models/module.model';

export class CreateModuleDto {
  @IsNotEmpty()
  @IsString()
  name: string = '';

  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Z0-9_]+$/, {
    message:
      'Code can only contain uppercase letters, numbers, and underscores',
  })
  code: string = '';

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  description?: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  icon: string = '';

  @IsOptional()
  @IsString()
  @Type(() => String)
  parentId?: string;

  @IsOptional()
  @IsString({ each: true })
  @Type(() => String)
  subModules?: string[];

  @IsArray()
  @IsOptional()
  defaultConfig: IConfigField[] = [];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isCore?: boolean;

  @IsString()
  @IsOptional()
  version?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  dependencies?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}
