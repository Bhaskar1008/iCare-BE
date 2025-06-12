import { RoleRepository } from '@/modules/role/role.repository';
import type { CreateRoleDto } from '@/modules/role/dto/create-role.dto';
import type { UpdateRoleDto } from '@/modules/role/dto/update-role.dto';
import type {
  RoleResponseDto,
  PermissionDto,
  ChannelDto,
  ResourceDto,
} from '@/modules/role/dto/role-response.dto';
import type { IRole } from '@/models/role.model';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';
import logger from '@/common/utils/logger';
import type {
  IRoleService,
  IRoleRepository,
} from '@/modules/role/interfaces/role.interface';
import type { FilterQuery } from 'mongoose';
import { Types } from 'mongoose';

export class RoleService implements IRoleService {
  private roleRepository: IRoleRepository;

  constructor() {
    this.roleRepository = new RoleRepository();
  }

  public async createRole(data: CreateRoleDto): Promise<RoleResponseDto> {
    try {
      logger.debug('Creating role', { data });

      await this.validateRoleCreation(data);

      const roleData = {
        channelId: new Types.ObjectId(data.channelId),
        roleName: data.roleName,
        roleCode: data.roleCode,
        description: data.description,
        permissions: (data.permissions ?? []).map(p => new Types.ObjectId(p)),
        isSystem: data.isSystem ?? false,
        status: data.status ?? 'active',
      };

      const role = await this.roleRepository.create(roleData);
      logger.info('Role created successfully', {
        id: role._id,
        name: role.roleName,
        code: role.roleCode,
      });

      return this.mapToResponseDto(role);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create role:', {
        error: err.message,
        stack: err.stack,
        data,
      });
      throw error;
    }
  }

  private async validateRoleCreation(data: CreateRoleDto): Promise<void> {
    const existingRoleByName = await this.roleRepository.findByName(
      data.roleName,
      data.channelId,
    );
    if (existingRoleByName) {
      throw new DatabaseValidationException(
        `Role with name '${data.roleName}' already exists in this channel`,
      );
    }

    const existingRoleByCode = await this.roleRepository.findByCode(
      data.roleCode,
      data.channelId,
    );
    if (existingRoleByCode) {
      throw new DatabaseValidationException(
        `Role with code '${data.roleCode}' already exists in this channel`,
      );
    }
  }

  public async getRoleById(id: string): Promise<RoleResponseDto | null> {
    try {
      logger.debug('Getting role by ID', { id });
      const role = await this.roleRepository.findById(id);

      if (!role || role.isDeleted) {
        logger.debug('Role not found or deleted', { id });
        return null;
      }

      logger.debug('Role found by ID', { id, name: role.roleName });
      return this.mapToResponseDto(role);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get role by ID:', {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }

  public async getRoleByCode(
    code: string | number,
    channelId?: string,
  ): Promise<RoleResponseDto | null> {
    try {
      logger.debug('Getting role by code', { code, channelId });
      const role = await this.roleRepository.findByCode(code, channelId);

      if (!role) {
        logger.debug('Role not found by code', { code, channelId });
        return null;
      }

      logger.debug('Role found by code', { code, channelId, id: role._id });
      return this.mapToResponseDto(role);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get role by code:', {
        error: err.message,
        stack: err.stack,
        code,
        channelId,
      });
      throw error;
    }
  }

  public async getRolesByChannelId(
    channelId: string,
  ): Promise<RoleResponseDto[]> {
    try {
      logger.debug('Getting roles by channel ID', { channelId });
      const roles = await this.roleRepository.findByChannelId(channelId);

      logger.debug('Roles retrieved by channel ID', {
        channelId,
        count: roles.length,
      });
      return roles.map(role => this.mapToResponseDto(role));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get roles by channel ID:', {
        error: err.message,
        stack: err.stack,
        channelId,
      });
      throw error;
    }
  }

  public async getAllRoles(
    page: number = 1,
    limit: number = 10,
    status?: 'active' | 'inactive',
    channelId?: string,
    search?: string,
    isSystem?: boolean,
  ): Promise<{
    roles: RoleResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      this.logRoleQueryParams(page, limit, status, channelId, search, isSystem);
      return await this.processRoleQuery(
        page,
        limit,
        status,
        channelId,
        search,
        isSystem,
      );
    } catch (error) {
      this.handleRoleQueryError(
        error,
        page,
        limit,
        status,
        channelId,
        search,
        isSystem,
      );
      throw error;
    }
  }

  private logRoleQueryParams(
    page: number,
    limit: number,
    status?: 'active' | 'inactive',
    channelId?: string,
    search?: string,
    isSystem?: boolean,
  ): void {
    logger.debug('Getting all roles', {
      page,
      limit,
      status,
      channelId,
      search,
      isSystem,
    });
  }

  private async processRoleQuery(
    page: number,
    limit: number,
    status?: 'active' | 'inactive',
    channelId?: string,
    search?: string,
    isSystem?: boolean,
  ): Promise<{
    roles: RoleResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const filter = this.buildSearchFilter(status, channelId, search, isSystem);
    const result = await this.roleRepository.findWithPagination(
      filter,
      page,
      limit,
    );

    this.logRolesRetrieved(result, page, limit);
    return this.formatRolesResponse(result, page, limit);
  }

  private logRolesRetrieved(
    result: { roles: IRole[]; total: number },
    page: number,
    limit: number,
  ): void {
    logger.debug('Roles retrieved successfully', {
      count: result.roles.length,
      total: result.total,
      page,
      limit,
    });
  }

  private formatRolesResponse(
    result: { roles: IRole[]; total: number; totalPages: number },
    page: number,
    limit: number,
  ): {
    roles: RoleResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } {
    return {
      roles: result.roles.map(role => this.mapToResponseDto(role)),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  private handleRoleQueryError(
    error: unknown,
    page: number,
    limit: number,
    status?: 'active' | 'inactive',
    channelId?: string,
    search?: string,
    isSystem?: boolean,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get all roles:', {
      error: err.message,
      stack: err.stack,
      page,
      limit,
      status,
      channelId,
      search,
      isSystem,
    });
  }

  private buildSearchFilter(
    status?: 'active' | 'inactive',
    channelId?: string,
    search?: string,
    isSystem?: boolean,
  ): FilterQuery<IRole> {
    const filter: FilterQuery<IRole> = {};

    if (status) {
      filter.status = status;
    }

    if (channelId) {
      filter.channelId = channelId;
    }

    if (typeof isSystem === 'boolean') {
      filter.isSystem = isSystem;
    }

    if (search) {
      filter.$or = [
        { roleName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    return filter;
  }

  public async getActiveRoles(channelId?: string): Promise<RoleResponseDto[]> {
    try {
      logger.debug('Getting active roles', { channelId });
      const roles = await this.roleRepository.findActiveRoles(channelId);

      logger.debug('Active roles retrieved successfully', {
        channelId,
        count: roles.length,
      });
      return roles.map(role => this.mapToResponseDto(role));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get active roles:', {
        error: err.message,
        stack: err.stack,
        channelId,
      });
      throw error;
    }
  }

  public async getSystemRoles(): Promise<RoleResponseDto[]> {
    try {
      logger.debug('Getting system roles');
      const roles = await this.roleRepository.findSystemRoles();

      logger.debug('System roles retrieved successfully', {
        count: roles.length,
      });
      return roles.map(role => this.mapToResponseDto(role));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get system roles:', {
        error: err.message,
        stack: err.stack,
      });
      throw error;
    }
  }

  public async updateRole(
    id: string,
    data: UpdateRoleDto,
  ): Promise<RoleResponseDto | null> {
    try {
      logger.debug('Updating role', { id, data });

      const existingRole = await this.findExistingRoleForUpdate(id);
      if (!existingRole) {
        return null;
      }

      await this.validateRoleUpdate(id, data, existingRole);
      const updateData = this.buildRoleUpdateData(data);
      return await this.performRoleUpdate(id, updateData);
    } catch (error) {
      this.logRoleUpdateError(error, id, data);
      throw error;
    }
  }

  private async findExistingRoleForUpdate(id: string): Promise<IRole | null> {
    const existingRole = await this.roleRepository.findById(id);
    if (!existingRole || existingRole.isDeleted) {
      logger.debug('Role not found for update', { id });
      return null;
    }
    return existingRole;
  }

  private buildRoleUpdateData(data: UpdateRoleDto): Partial<IRole> {
    const updateData: Partial<IRole> = {
      roleName: data.roleName,
      roleCode: data.roleCode,
      description: data.description,
      isSystem: data.isSystem,
      status: data.status,
    };

    if (data.permissions) {
      updateData.permissions = data.permissions.map(p => new Types.ObjectId(p));
    }

    return updateData;
  }

  private async performRoleUpdate(
    id: string,
    updateData: Partial<IRole>,
  ): Promise<RoleResponseDto | null> {
    const updatedRole = await this.roleRepository.updateById(id, updateData);
    if (!updatedRole) {
      logger.debug('Role update failed', { id });
      return null;
    }

    logger.info('Role updated successfully', {
      id,
      name: updatedRole.roleName,
    });
    return this.mapToResponseDto(updatedRole);
  }

  private logRoleUpdateError(
    error: unknown,
    id: string,
    data: UpdateRoleDto,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update role:', {
      error: err.message,
      stack: err.stack,
      id,
      data,
    });
  }

  private async validateRoleUpdate(
    id: string,
    data: UpdateRoleDto,
    existingRole: IRole,
  ): Promise<void> {
    if (data.roleName && data.roleName !== existingRole.roleName) {
      const existingRoleByName = await this.roleRepository.findByName(
        data.roleName,
        existingRole.channelId.toString(),
      );
      if (existingRoleByName && existingRoleByName._id.toString() !== id) {
        throw new DatabaseValidationException(
          `Role with name '${data.roleName}' already exists in this channel`,
        );
      }
    }

    if (data.roleCode && data.roleCode !== existingRole.roleCode) {
      const existingRoleByCode = await this.roleRepository.findByCode(
        data.roleCode,
        existingRole.channelId.toString(),
      );
      if (existingRoleByCode && existingRoleByCode._id.toString() !== id) {
        throw new DatabaseValidationException(
          `Role with code '${data.roleCode}' already exists in this channel`,
        );
      }
    }
  }

  public async deleteRole(id: string): Promise<boolean> {
    try {
      logger.debug('Deleting role', { id });

      const existingRole = await this.roleRepository.findById(id);
      if (!existingRole || existingRole.isDeleted) {
        logger.debug('Role not found for deletion', { id });
        return false;
      }

      if (existingRole.isSystem) {
        throw new DatabaseValidationException('System roles cannot be deleted');
      }

      // Soft delete by updating isDeleted flag
      const deletedRole = await this.roleRepository.updateById(id, {
        isDeleted: true,
        deletedAt: new Date(),
      });

      const success = !!deletedRole;
      logger.info('Role deletion completed', { id, success });
      return success;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete role:', {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }

  private mapToResponseDto(role: IRole): RoleResponseDto {
    return {
      _id: this.safeString(role._id),
      channel: this.formatChannel(role.channelId),
      roleName: role.roleName,
      roleCode: role.roleCode,
      description: role.description,
      permissions: this.formatPermissions(role.permissions),
      isSystem: role.isSystem,
      status: role.status,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  private safeString(value: unknown): string {
    if (!value) return '';

    // Handle different types safely to avoid no-base-to-string error
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean')
      return String(value);
    if (value instanceof Date) return value.toISOString();

    // For objects that have toString method (like ObjectId)
    if (
      typeof value === 'object' &&
      value !== null &&
      'toString' in value &&
      typeof (value as { toString(): string }).toString === 'function'
    ) {
      return (value as { toString(): string }).toString();
    }

    // Fallback for other objects
    return '[object]';
  }

  private formatChannel(channel: unknown): ChannelDto | string {
    logger.debug('Formatting channel', { channel });
    if (!channel || typeof channel !== 'object') return '';

    const channelObj = channel as Record<string, unknown>;
    const channelDto: ChannelDto = {
      _id: this.safeString(channelObj._id),
      channelName:
        typeof channelObj.channelName === 'string'
          ? channelObj.channelName
          : undefined,
      channelCode:
        typeof channelObj.channelCode === 'string' ||
        typeof channelObj.channelCode === 'number'
          ? channelObj.channelCode
          : undefined,
      channelStatus:
        typeof channelObj.channelStatus === 'string'
          ? channelObj.channelStatus
          : undefined,
    };
    logger.debug('Formatted channel', { channelDto });
    return channelDto;
  }

  private formatPermissions(
    permissions: unknown[],
  ): Array<PermissionDto | string> {
    if (!Array.isArray(permissions)) return [];

    return permissions
      .map(permission => {
        if (!permission || typeof permission !== 'object')
          return this.safeString(permission);
        return this.formatPermission(permission as Record<string, unknown>);
      })
      .filter(Boolean);
  }

  private formatPermission(permission: Record<string, unknown>): PermissionDto {
    return {
      _id: this.safeString(permission._id),
      resource: this.formatResource(permission.resourceId),
      action:
        typeof permission.action === 'string' ? permission.action : undefined,
      effect:
        typeof permission.effect === 'string' ? permission.effect : undefined,
      conditions: permission.conditions as Record<string, unknown> | undefined,
      status:
        typeof permission.status === 'string' ? permission.status : undefined,
      createdAt:
        permission.createdAt instanceof Date ? permission.createdAt : undefined,
      updatedAt:
        permission.updatedAt instanceof Date ? permission.updatedAt : undefined,
    };
  }

  private formatResource(resource: unknown): ResourceDto | string | undefined {
    if (!resource) return undefined;
    if (typeof resource !== 'object') return this.safeString(resource);

    const resourceObj = resource as Record<string, unknown>;
    if (!resourceObj._id) return this.safeString(resource);

    return {
      _id: this.safeString(resourceObj._id),
      name: typeof resourceObj.name === 'string' ? resourceObj.name : undefined,
      identifier:
        typeof resourceObj.identifier === 'string'
          ? resourceObj.identifier
          : undefined,
      type: typeof resourceObj.type === 'string' ? resourceObj.type : undefined,
      parentId: resourceObj.parentId
        ? this.safeString(resourceObj.parentId)
        : undefined,
      status:
        typeof resourceObj.status === 'string' ? resourceObj.status : undefined,
    };
  }
}
