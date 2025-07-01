import {
  IsArray,
  IsBoolean,
  IsDate,
  IsMongoId,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { IAccessControl } from '@/models/access-control.model';
import { Types } from 'mongoose';

class RoleAssignmentDto {
  @IsMongoId()
  roleId: string = '';

  @IsString()
  roleName: string = '';

  @IsString()
  roleCode: string = '';

  @IsBoolean()
  status: boolean = false;
}

class ModuleConfigResponseDto {
  @IsMongoId()
  moduleId: string = '';

  @IsString()
  moduleName: string = '';

  @IsString()
  moduleCode: string = '';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleAssignmentDto)
  rolesAssigned: RoleAssignmentDto[] = [];
}

export class AccessControlResponseDto {
  @IsString()
  id: string = '';

  @IsMongoId()
  projectId: string = '';

  @IsMongoId()
  channelId: string = '';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModuleConfigResponseDto)
  moduleConfigs: ModuleConfigResponseDto[] = [];

  @IsDate()
  @Type(() => Date)
  createdAt: Date = new Date();

  @IsDate()
  @Type(() => Date)
  updatedAt: Date = new Date();

  constructor(accessControl: IAccessControl) {
    this.id =
      typeof accessControl._id === 'string' ||
      (accessControl._id &&
        typeof accessControl._id === 'object' &&
        '_id' in accessControl._id)
        ? accessControl._id.toString()
        : '';
    this.projectId = accessControl.projectId
      ? typeof accessControl.projectId === 'string'
        ? accessControl.projectId
        : (accessControl.projectId as Types.ObjectId).toString()
      : '';
    this.channelId = accessControl.channelId
      ? typeof accessControl.channelId === 'string'
        ? accessControl.channelId
        : (accessControl.channelId as Types.ObjectId).toString()
      : '';
    this.moduleConfigs = accessControl.moduleConfigs.map(config => {
      let moduleId = '';
      let moduleName = '';
      let moduleCode = '';

      if (typeof config.moduleId === 'object' && config.moduleId !== null) {
        if ('_id' in config.moduleId) {
          moduleId = config.moduleId._id.toString();
          if ('name' in config.moduleId && 'code' in config.moduleId) {
            moduleName = String(config.moduleId.name);
            moduleCode = String(config.moduleId.code);
          }
        }
      } else if (typeof config.moduleId === 'string') {
        moduleId = config.moduleId;
      }

      return {
        moduleId,
        moduleName,
        moduleCode,
        rolesAssigned: config.roleConfigs.map(roleConfig => {
          let roleId = '';
          let roleName = '';
          let roleCode = '';

          if (
            typeof roleConfig.roleId === 'object' &&
            roleConfig.roleId !== null
          ) {
            if ('_id' in roleConfig.roleId) {
              roleId = roleConfig.roleId._id.toString();
              if (
                'roleName' in roleConfig.roleId &&
                'roleCode' in roleConfig.roleId
              ) {
                roleName = String(roleConfig.roleId.roleName);
                roleCode = String(roleConfig.roleId.roleCode);
              }
            }
          } else if (typeof roleConfig.roleId === 'string') {
            roleId = roleConfig.roleId;
          }

          return {
            roleId,
            roleName,
            roleCode,
            status: roleConfig.status,
          };
        }),
      };
    });
    this.createdAt = accessControl.createdAt;
    this.updatedAt = accessControl.updatedAt;
  }
}
