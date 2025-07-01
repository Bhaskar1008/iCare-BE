import type { IAccessControl } from '@/models/access-control.model';
import { AccessControlRepository } from './access-control.repository';
import type { ModuleConfigDto } from './dto/create-access-control.dto';
import type { IAccessControlService } from './interfaces/access-control.interface';
import { NotFoundException } from '@/common/exceptions/not-found.exception';
import { ModuleModel } from '@/models/module.model';
import { RoleModel } from '@/models/role.model';

export class AccessControlService implements IAccessControlService {
  private readonly accessControlRepository: AccessControlRepository;

  constructor() {
    this.accessControlRepository = new AccessControlRepository();
  }

  private getRoleIdString(
    roleId: string | { _id: string | { toString(): string } },
  ): string {
    if (typeof roleId === 'string') {
      return roleId;
    }
    if (roleId && typeof roleId === 'object' && '_id' in roleId) {
      return roleId._id.toString();
    }
    return '';
  }

  private async getAllChannelRoles(channelId: string) {
    return RoleModel.find({
      channelId,
      status: 'active',
      isDeleted: false,
    })
      .select('_id')
      .lean();
  }

  private async getModuleDetails(moduleId: string) {
    const module = await ModuleModel.findById(moduleId)
      .select('name code')
      .lean();
    if (!module) {
      throw new NotFoundException(`Module with id ${moduleId} not found`);
    }
    return module;
  }

  public async getOrCreateDefaultAccessControl(
    projectId: string,
    channelId: string,
  ): Promise<IAccessControl> {
    // First try to find existing configuration
    let existingConfig =
      await this.accessControlRepository.findByProjectAndChannel(
        projectId,
        channelId,
      );
    // Get all active roles for the channel
    const roles = await this.getAllChannelRoles(channelId);
    if (!roles.length) {
      throw new NotFoundException('No active roles found for the channel');
    }

    if (existingConfig) {
      // Update existing config to include any new roles with default false status
      const updatedModuleConfigs = await Promise.all(
        existingConfig.moduleConfigs.map(async config => {
          // Get module details
          const moduleDetails = await this.getModuleDetails(
            config.moduleId._id.toString(),
          );
          // Get existing role IDs in this config
          const existingRoleIds = new Set(
            config.roleConfigs.map(rc => this.getRoleIdString(rc.roleId)),
          );
          // Add any missing roles with status false
          const allRoleConfigs = [
            ...config.roleConfigs,
            ...roles
              .filter(role => !existingRoleIds.has(role._id.toString()))
              .map(role => ({
                roleId: role._id,
                status: false,
              })),
          ];
          return {
            moduleId: moduleDetails._id,
            moduleCode: moduleDetails.code,
            moduleName: moduleDetails.name,
            rolesAssigned: allRoleConfigs.map(rc => ({
              roleId: this.getRoleIdString(rc.roleId),
              status: rc.status,
            })),
          };
        }),
      );

      // Update the configuration with new role assignments
      existingConfig =
        await this.accessControlRepository.createOrUpdateAccessControl(
          projectId,
          channelId,
          updatedModuleConfigs,
        );

      if (!existingConfig) {
        throw new Error('Failed to update access control configuration');
      }

      return existingConfig;
    }

    // If no config exists, create a default one
    // 1. Get all active modules
    const modules = await ModuleModel.find({
      isActive: true,
      isDeleted: false,
      accessControl: true, // Only get modules that require access control
    })
      .select('_id name code')
      .lean();

    if (!modules.length) {
      throw new NotFoundException('No active modules found');
    }

    // 2. Create default module configs with all roles set to false
    const defaultModuleConfigs = modules.map(module => ({
      moduleId: module._id.toString(),
      rolesAssigned: roles.map(role => ({
        roleId: role._id.toString(),
        status: false,
      })),
    }));

    // 3. Create and return the new access control configuration
    return this.accessControlRepository.createOrUpdateAccessControl(
      projectId,
      channelId,
      defaultModuleConfigs,
    );
  }

  public async createOrUpdateAccessControl(
    projectId: string,
    channelId: string,
    moduleConfigs: ModuleConfigDto[],
  ): Promise<IAccessControl> {
    return this.accessControlRepository.createOrUpdateAccessControl(
      projectId,
      channelId,
      moduleConfigs,
    );
  }
}
