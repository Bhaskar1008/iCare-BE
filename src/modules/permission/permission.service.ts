import { PermissionRepository } from '@/modules/permission/permission.repository';
import type { CreatePermissionDto } from '@/modules/permission/dto/create-permission.dto';
import type { UpdatePermissionDto } from '@/modules/permission/dto/update-permission.dto';
import type { PermissionResponseDto } from '@/modules/permission/dto/permission-response.dto';
import type { IPermission } from '@/models/permission.model';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';
import logger from '@/common/utils/logger';
import { Types } from 'mongoose';
import type {
  IPermissionService,
  IPermissionRepository,
} from '@/modules/permission/interfaces/permission.interface';

export class PermissionService implements IPermissionService {
  private permissionRepository: IPermissionRepository;

  constructor() {
    this.permissionRepository = new PermissionRepository();
  }

  public async createPermission(
    data: CreatePermissionDto,
  ): Promise<PermissionResponseDto> {
    try {
      logger.debug('Creating permission', { data });

      const existingPermission =
        await this.permissionRepository.findByResourceAndAction(
          data.resourceId,
          data.action,
        );
      if (existingPermission) {
        throw new DatabaseValidationException(
          `Permission for resource '${data.resourceId}' with action '${data.action}' already exists`,
        );
      }

      const permissionData = {
        resourceId: new Types.ObjectId(data.resourceId),
        action: data.action,
        effect: data.effect ?? 'allow',
        conditions: data.conditions,
        status: data.status ?? 'active',
      };

      const permission = await this.permissionRepository.create(permissionData);
      logger.info('Permission created successfully', {
        id: permission._id,
        resourceId: permission.resourceId,
        action: permission.action,
      });

      return this.mapToResponseDto(permission);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create permission:', {
        error: err.message,
        stack: err.stack,
        data,
      });
      throw error;
    }
  }

  public async getPermissionById(
    id: string,
  ): Promise<PermissionResponseDto | null> {
    try {
      logger.debug('Getting permission by ID', { id });
      const permission = await this.permissionRepository.findById(id);

      if (!permission || permission.isDeleted) {
        logger.debug('Permission not found or deleted', { id });
        return null;
      }

      logger.debug('Permission found by ID', {
        id,
        resourceId: permission.resourceId,
        action: permission.action,
      });
      return this.mapToResponseDto(permission);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get permission by ID:', {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }

  public async getPermissionsByResourceId(
    resourceId: string,
  ): Promise<PermissionResponseDto[]> {
    try {
      logger.debug('Getting permissions by resource ID', { resourceId });
      const permissions =
        await this.permissionRepository.findByResourceId(resourceId);

      logger.debug('Permissions found by resource ID', {
        resourceId,
        count: permissions.length,
      });
      return permissions.map(permission => this.mapToResponseDto(permission));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get permissions by resource ID:', {
        error: err.message,
        stack: err.stack,
        resourceId,
      });
      throw error;
    }
  }

  public async getAllPermissions(
    page: number = 1,
    limit: number = 10,
    status?: 'active' | 'inactive',
    effect?: 'allow' | 'deny',
    resourceId?: string,
    action?: string,
  ): Promise<{
    permissions: PermissionResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      this.logPermissionQueryParams(
        page,
        limit,
        status,
        effect,
        resourceId,
        action,
      );
      return await this.processPermissionQuery(
        page,
        limit,
        status,
        effect,
        resourceId,
        action,
      );
    } catch (error) {
      this.handlePermissionQueryError(
        error,
        page,
        limit,
        status,
        effect,
        resourceId,
        action,
      );
      throw error;
    }
  }

  private logPermissionQueryParams(
    page: number,
    limit: number,
    status?: 'active' | 'inactive',
    effect?: 'allow' | 'deny',
    resourceId?: string,
    action?: string,
  ): void {
    logger.debug('Getting all permissions', {
      page,
      limit,
      status,
      effect,
      resourceId,
      action,
    });
  }

  private async processPermissionQuery(
    page: number,
    limit: number,
    status?: 'active' | 'inactive',
    effect?: 'allow' | 'deny',
    resourceId?: string,
    action?: string,
  ): Promise<{
    permissions: PermissionResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const result = await this.fetchPermissionsWithPagination(
      page,
      limit,
      status,
      effect,
      resourceId,
      action,
    );

    this.logPermissionsRetrieved(result, page, limit);
    return this.formatPermissionsResponse(result, page, limit);
  }

  private handlePermissionQueryError(
    error: unknown,
    page: number,
    limit: number,
    status?: 'active' | 'inactive',
    effect?: 'allow' | 'deny',
    resourceId?: string,
    action?: string,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get all permissions:', {
      error: err.message,
      stack: err.stack,
      page,
      limit,
      status,
      effect,
      resourceId,
      action,
    });
  }

  private async fetchPermissionsWithPagination(
    page: number,
    limit: number,
    status?: 'active' | 'inactive',
    effect?: 'allow' | 'deny',
    resourceId?: string,
    action?: string,
  ): Promise<{
    permissions: IPermission[];
    total: number;
    totalPages: number;
  }> {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (effect) filter.effect = effect;
    if (resourceId) filter.resourceId = resourceId;
    if (action) filter.action = action;

    return this.permissionRepository.findWithPagination(filter, page, limit);
  }

  private logPermissionsRetrieved(
    result: { permissions: IPermission[]; total: number },
    page: number,
    limit: number,
  ): void {
    logger.debug('Permissions retrieved successfully', {
      count: result.permissions.length,
      total: result.total,
      page,
      limit,
    });
  }

  private formatPermissionsResponse(
    result: { permissions: IPermission[]; total: number; totalPages: number },
    page: number,
    limit: number,
  ): {
    permissions: PermissionResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } {
    return {
      permissions: result.permissions.map(permission =>
        this.mapToResponseDto(permission),
      ),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  public async getActivePermissions(): Promise<PermissionResponseDto[]> {
    try {
      logger.debug('Getting active permissions');
      const permissions =
        await this.permissionRepository.findActivePermissions();

      logger.debug('Active permissions retrieved successfully', {
        count: permissions.length,
      });
      return permissions.map(permission => this.mapToResponseDto(permission));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get active permissions:', {
        error: err.message,
        stack: err.stack,
      });
      throw error;
    }
  }

  public async updatePermission(
    id: string,
    data: UpdatePermissionDto,
  ): Promise<PermissionResponseDto | null> {
    try {
      logger.debug('Updating permission', { id, data });

      const existingPermission = await this.findExistingPermission(id);
      if (!existingPermission) {
        return null;
      }

      await this.validatePermissionUpdate(id, data, existingPermission);
      const updateData = this.buildUpdateData(data);
      const permission = await this.performPermissionUpdate(id, updateData);

      if (!permission) {
        logger.debug('Permission not found after update', { id });
        return null;
      }

      this.logPermissionUpdated(permission);
      return this.mapToResponseDto(permission);
    } catch (error) {
      this.logUpdateError(error, id, data);
      throw error;
    }
  }

  private async findExistingPermission(
    id: string,
  ): Promise<IPermission | null> {
    const existingPermission = await this.permissionRepository.findById(id);
    if (!existingPermission || existingPermission.isDeleted) {
      logger.debug('Permission not found for update', { id });
      return null;
    }
    return existingPermission;
  }

  private async validatePermissionUpdate(
    id: string,
    data: UpdatePermissionDto,
    existingPermission: IPermission,
  ): Promise<void> {
    if (data.resourceId || data.action) {
      await this.checkPermissionConflict(id, data, existingPermission);
    }
  }

  private async checkPermissionConflict(
    id: string,
    data: UpdatePermissionDto,
    existingPermission: IPermission,
  ): Promise<void> {
    const resourceId = data.resourceId ?? existingPermission.resourceId;
    const action = data.action ?? existingPermission.action;

    const conflictingPermission =
      await this.permissionRepository.findByResourceAndAction(
        resourceId.toString(),
        action,
      );

    if (conflictingPermission && conflictingPermission._id.toString() !== id) {
      throw new DatabaseValidationException(
        `Permission for resource '${String(resourceId)}' with action '${action}' already exists`,
      );
    }
  }

  private buildUpdateData(data: UpdatePermissionDto): Partial<IPermission> {
    const updateData: Partial<IPermission> = {
      action: data.action,
      effect: data.effect,
      conditions: data.conditions,
      status: data.status,
    };

    if (data.resourceId) {
      updateData.resourceId = new Types.ObjectId(data.resourceId);
    }

    return updateData;
  }

  private async performPermissionUpdate(
    id: string,
    updateData: Partial<IPermission>,
  ): Promise<IPermission | null> {
    return this.permissionRepository.update(id, updateData);
  }

  private logPermissionUpdated(permission: IPermission): void {
    logger.info('Permission updated successfully', {
      id: permission._id,
      resourceId: permission.resourceId,
      action: permission.action,
    });
  }

  private logUpdateError(
    error: unknown,
    id: string,
    data: UpdatePermissionDto,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update permission:', {
      error: err.message,
      stack: err.stack,
      id,
      data,
    });
  }

  public async deletePermission(id: string): Promise<boolean> {
    try {
      logger.debug('Deleting permission', { id });

      const existingPermission = await this.permissionRepository.findById(id);
      if (!existingPermission || existingPermission.isDeleted) {
        logger.debug('Permission not found for deletion', { id });
        return false;
      }

      const deleted = await this.permissionRepository.delete(id);

      if (deleted) {
        logger.info('Permission deleted successfully', { id });
      }

      return deleted;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete permission:', {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }

  private mapToResponseDto(permission: IPermission): PermissionResponseDto {
    return {
      _id: permission._id.toString(),
      resourceId: permission.resourceId.toString(),
      action: permission.action,
      effect: permission.effect,
      conditions: permission.conditions,
      status: permission.status,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    };
  }
}
