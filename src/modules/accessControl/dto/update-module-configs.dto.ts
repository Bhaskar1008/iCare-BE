import {
  IsArray,
  IsBoolean,
  ValidateNested,
  IsMongoId,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

class RoleConfigDto {
  @IsMongoId()
  roleId: string = '';

  @IsBoolean()
  status: boolean = false;
}

class ModuleConfigDto {
  @IsMongoId()
  moduleId: string = '';

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'At least one role configuration is required' })
  @Type(() => RoleConfigDto)
  roleConfigs: RoleConfigDto[] = [];
}

export class UpdateModuleConfigsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'At least one module configuration is required' })
  @Type(() => ModuleConfigDto)
  moduleConfigs: ModuleConfigDto[] = [];
}
