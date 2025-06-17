import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsObject,
  IsBoolean,
  IsArray,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsObject()
  @IsOptional()
  defaultConfig: Record<string, any> = {};

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
