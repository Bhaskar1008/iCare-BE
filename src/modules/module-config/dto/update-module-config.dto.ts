import {
  IsString,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConfigFieldDto } from './create-module-config.dto';

export class UpdateModuleConfigDto {
  @IsOptional()
  @IsString()
  configName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigFieldDto)
  fields?: ConfigFieldDto[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
