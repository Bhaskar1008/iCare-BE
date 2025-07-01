import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsMongoId,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConfigValueDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsString()
  @IsNotEmpty()
  value!: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependentValues?: string[];
}

export class ConfigFieldDto {
  @IsString()
  @IsNotEmpty()
  fieldName!: string;

  @IsString()
  @IsNotEmpty()
  fieldType!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigValueDto)
  values!: ConfigValueDto[];
}

export class CreateModuleConfigDto {
  @IsMongoId()
  @IsNotEmpty()
  moduleId!: string;

  @IsOptional()
  @IsMongoId()
  projectId?: string;

  @IsString()
  @IsNotEmpty()
  configName!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigFieldDto)
  fields!: ConfigFieldDto[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
