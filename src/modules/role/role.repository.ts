import { BaseRepository } from '@/repository/base.repository';
import { RoleModel, type IRole } from '@/models/role.model';
import type { FilterQuery } from 'mongoose';
import logger from '@/common/utils/logger';
import type { IRoleRepository } from '@/modules/role/interfaces/role.interface';

export class RoleRepository
  extends BaseRepository<IRole>
  implements IRoleRepository
{
  constructor() {
    super(RoleModel);
  }

  public async findByCode(
    code: string | number,
    channelId?: string,
  ): Promise<IRole | null> {
    try {
      logger.debug('Finding role by code', { code, channelId });
      const filter: FilterQuery<IRole> = { roleCode: code, isDeleted: false };
      if (channelId) {
        filter.channelId = channelId;
      }

      const result = await this.model
        .findOne(filter)
        .populate({
          path: 'channelId',
          select: 'channelName channelCode status',
        })
        .populate({
          path: 'permissions',
          populate: {
            path: 'resourceId',
            select: 'name identifier type parentId status',
          },
        })
        .exec();
      logger.debug('Role found by code', { code, channelId, found: !!result });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find role by code:', {
        error: err.message,
        stack: err.stack,
        code,
        channelId,
      });
      throw error;
    }
  }

  public async findByName(
    name: string,
    channelId?: string,
  ): Promise<IRole | null> {
    try {
      logger.debug('Finding role by name', { name, channelId });
      const filter: FilterQuery<IRole> = { roleName: name, isDeleted: false };
      if (channelId) {
        filter.channelId = channelId;
      }

      const result = await this.model
        .findOne(filter)
        .populate({
          path: 'channelId',
          select: 'channelName channelCode status',
        })
        .populate({
          path: 'permissions',
          populate: {
            path: 'resourceId',
            select: 'name identifier type parentId status',
          },
        })
        .exec();
      logger.debug('Role found by name', { name, channelId, found: !!result });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find role by name:', {
        error: err.message,
        stack: err.stack,
        name,
        channelId,
      });
      throw error;
    }
  }

  public async findByChannelId(channelId: string): Promise<IRole[]> {
    try {
      logger.debug('Finding roles by channel ID', { channelId });
      const result = await this.model
        .find({ channelId, isDeleted: false })
        .populate({
          path: 'channelId',
          select: 'channelName channelCode status',
        })
        .populate({
          path: 'permissions',
          populate: {
            path: 'resourceId',
            select: 'name identifier type parentId status',
          },
        })
        .sort({ createdAt: -1 })
        .exec();
      logger.debug('Roles found by channel ID', {
        channelId,
        count: result.length,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find roles by channel ID:', {
        error: err.message,
        stack: err.stack,
        channelId,
      });
      throw error;
    }
  }

  public async findActiveRoles(channelId?: string): Promise<IRole[]> {
    try {
      logger.debug('Finding active roles', { channelId });
      const filter: FilterQuery<IRole> = { status: 'active', isDeleted: false };
      if (channelId) {
        filter.channelId = channelId;
      }

      const result = await this.model
        .find(filter)
        .populate({
          path: 'channelId',
          select: 'channelName channelCode status',
        })
        .populate({
          path: 'permissions',
          populate: {
            path: 'resourceId',
            select: 'name identifier type parentId status',
          },
        })
        .sort({ createdAt: -1 })
        .exec();
      logger.debug('Active roles found', { channelId, count: result.length });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find active roles:', {
        error: err.message,
        stack: err.stack,
        channelId,
      });
      throw error;
    }
  }

  public async findSystemRoles(): Promise<IRole[]> {
    try {
      logger.debug('Finding system roles');
      const result = await this.model
        .find({ isSystem: true, isDeleted: false })
        .populate({
          path: 'channelId',
          select: 'channelName channelCode status',
        })
        .populate({
          path: 'permissions',
          populate: {
            path: 'resourceId',
            select: 'name identifier type parentId status',
          },
        })
        .sort({ createdAt: -1 })
        .exec();
      logger.debug('System roles found', { count: result.length });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find system roles:', {
        error: err.message,
        stack: err.stack,
      });
      throw error;
    }
  }

  public async findWithPagination(
    filter: FilterQuery<IRole> = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<{ roles: IRole[]; total: number; totalPages: number }> {
    try {
      this.logPaginationStart(filter, page, limit);
      const result = await this.executeRolePaginationQuery(filter, page, limit);
      this.logPaginationResults(result, page, limit);
      return result;
    } catch (error) {
      this.handlePaginationError(error, filter, page, limit);
      throw error;
    }
  }

  private logPaginationStart(
    filter: FilterQuery<IRole>,
    page: number,
    limit: number,
  ): void {
    const skip = (page - 1) * limit;
    const baseFilter = { ...filter, isDeleted: false };
    logger.debug('Finding roles with pagination', {
      filter: baseFilter,
      page,
      limit,
      skip,
    });
  }

  private async executeRolePaginationQuery(
    filter: FilterQuery<IRole>,
    page: number,
    limit: number,
  ): Promise<{ roles: IRole[]; total: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const baseFilter = { ...filter, isDeleted: false };

    const [roles, total] = await Promise.all([
      this.model
        .find(baseFilter)
        .populate({
          path: 'channelId',
          select: 'channelName channelCode status',
        })
        .populate({
          path: 'permissions',
          populate: {
            path: 'resourceId',
            select: 'name identifier type parentId status',
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(baseFilter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { roles, total, totalPages };
  }

  private logPaginationResults(
    result: { roles: IRole[]; total: number; totalPages: number },
    page: number,
    limit: number,
  ): void {
    logger.debug('Roles found with pagination', {
      count: result.roles.length,
      total: result.total,
      totalPages: result.totalPages,
      page,
      limit,
    });
  }

  private handlePaginationError(
    error: unknown,
    filter: FilterQuery<IRole>,
    page: number,
    limit: number,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to find roles with pagination:', {
      error: err.message,
      stack: err.stack,
      filter,
      page,
      limit,
    });
  }

  /**
   * Override the findById method to fully populate references
   */
  public async findById(id: string): Promise<IRole | null> {
    try {
      logger.debug(`Finding ${this.modelName} by ID`, { id });
      const result = await this.model
        .findById(id)
        .populate({
          path: 'channelId',
          select: 'channelName channelCode status',
        })
        .populate({
          path: 'permissions',
          populate: {
            path: 'resourceId',
            select: 'name identifier type parentId status',
          },
        })
        .exec();
      logger.debug(`${this.modelName} found by ID`, { id, found: !!result });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to find ${this.modelName} by ID:`, {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }
}
