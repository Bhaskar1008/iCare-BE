import {
  IsArray,
  IsBoolean,
  ValidateNested,
  IsMongoId,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RoleAssignmentDto {
  @IsMongoId()
  roleId: string = '';

  @IsBoolean()
  status: boolean = false;
}

export class ModuleConfigDto {
  @IsMongoId()
  moduleId: string = '';

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'At least one role assignment is required' })
  @Type(() => RoleAssignmentDto)
  rolesAssigned: RoleAssignmentDto[] = [];
}

export class CreateAccessControlDto {
  @IsMongoId()
  projectId: string = '';

  @IsMongoId()
  channelId: string = '';

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'At least one module configuration is required' })
  @Type(() => ModuleConfigDto)
  moduleConfigs: ModuleConfigDto[] = [];
}
