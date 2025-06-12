import { BaseRepository } from '@/repository/base.repository';
import { PermissionModel, type IPermission } from '@/models/permission.model';
import type { FilterQuery } from 'mongoose';
import logger from '@/common/utils/logger';
import type { IPermissionRepository } from '@/modules/permission/interfaces/permission.interface';

export class PermissionRepository
  extends BaseRepository<IPermission>
  implements IPermissionRepository
{
  constructor() {
    super(PermissionModel);
  }

  public async findByResourceAndAction(
    resourceId: string,
    action: string,
  ): Promise<IPermission | null> {
    try {
      logger.debug('Finding permission by resource and action', {
        resourceId,
        action,
      });
      const result = await this.model
        .findOne({
          resourceId,
          action,
          isDeleted: false,
        })
        .exec();
      logger.debug('Permission found by resource and action', {
        resourceId,
        action,
        found: !!result,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find permission by resource and action:', {
        error: err.message,
        stack: err.stack,
        resourceId,
        action,
      });
      throw error;
    }
  }

  public async findActivePermissions(): Promise<IPermission[]> {
    try {
      logger.debug('Finding active permissions');
      const result = await this.model
        .find({ status: 'active' })
        .sort({ createdAt: -1 })
        .exec();
      logger.debug('Active permissions found', { count: result.length });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find active permissions:', {
        error: err.message,
        stack: err.stack,
      });
      throw error;
    }
  }

  public async findByResourceId(resourceId: string): Promise<IPermission[]> {
    try {
      logger.debug('Finding permissions by resource ID', { resourceId });
      const result = await this.model
        .find({ resourceId })
        .sort({ createdAt: -1 })
        .exec();
      logger.debug('Permissions found by resource ID', {
        resourceId,
        count: result.length,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find permissions by resource ID:', {
        error: err.message,
        stack: err.stack,
        resourceId,
      });
      throw error;
    }
  }

  public async findWithPagination(
    filter: FilterQuery<IPermission> = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    permissions: IPermission[];
    total: number;
    totalPages: number;
  }> {
    try {
      this.logPaginationStart(filter, page, limit);
      const result = await this.executePermissionPaginationQuery(
        filter,
        page,
        limit,
      );
      this.logPaginationResults(result, page, limit);
      return result;
    } catch (error) {
      this.handlePaginationError(error, filter, page, limit);
      throw error;
    }
  }

  private logPaginationStart(
    filter: FilterQuery<IPermission>,
    page: number,
    limit: number,
  ): void {
    const skip = (page - 1) * limit;
    logger.debug('Finding permissions with pagination', {
      filter,
      page,
      limit,
      skip,
    });
  }

  private async executePermissionPaginationQuery(
    filter: FilterQuery<IPermission>,
    page: number,
    limit: number,
  ): Promise<{
    permissions: IPermission[];
    total: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const baseFilter = { ...filter };

    const [permissions, total] = await Promise.all([
      this.model
        .find(baseFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(baseFilter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { permissions, total, totalPages };
  }

  private logPaginationResults(
    result: { permissions: IPermission[]; total: number; totalPages: number },
    page: number,
    limit: number,
  ): void {
    logger.debug('Permissions found with pagination', {
      count: result.permissions.length,
      total: result.total,
      totalPages: result.totalPages,
      page,
      limit,
    });
  }

  private handlePaginationError(
    error: unknown,
    filter: FilterQuery<IPermission>,
    page: number,
    limit: number,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to find permissions with pagination:', {
      error: err.message,
      stack: err.stack,
      filter,
      page,
      limit,
    });
  }

  public async update(
    id: string,
    data: Partial<IPermission>,
  ): Promise<IPermission | null> {
    try {
      logger.debug('Updating permission', { id, data });
      const result = await this.model
        .findByIdAndUpdate(
          id,
          { ...data, updatedAt: new Date() },
          { new: true, runValidators: true },
        )
        .exec();
      logger.debug('Permission updated successfully', { id, found: !!result });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update permission:', {
        error: err.message,
        stack: err.stack,
        id,
        data,
      });
      throw error;
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      logger.debug('Deleting permission', { id });
      const result = await this.model
        .findByIdAndUpdate(
          id,
          { isDeleted: true, deletedAt: new Date() },
          { new: true },
        )
        .exec();
      logger.debug('Permission deleted successfully', { id, found: !!result });
      return !!result;
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
}
