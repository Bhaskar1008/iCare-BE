import { BaseRepository } from '@/repository/base.repository';
import { ResourceModel, type IResource } from '@/models/resource.model';
import type { FilterQuery } from 'mongoose';
import logger from '@/common/utils/logger';
import type { IPermissionResourceRepository } from '@/modules/permissionResources/interfaces/permission-resource.interface';

export class PermissionResourceRepository
  extends BaseRepository<IResource>
  implements IPermissionResourceRepository
{
  constructor() {
    super(ResourceModel);
  }

  public async findByIdentifier(identifier: string): Promise<IResource | null> {
    try {
      logger.debug('Finding resource by identifier', { identifier });
      const result = await this.model.findOne({ identifier }).exec();
      logger.debug('Resource found by identifier', {
        identifier,
        found: !!result,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find resource by identifier:', {
        error: err.message,
        stack: err.stack,
        identifier,
      });
      throw error;
    }
  }

  public async findActiveResources(): Promise<IResource[]> {
    try {
      logger.debug('Finding active resources');
      const result = await this.model
        .find({ status: 'active' })
        .sort({ createdAt: -1 })
        .exec();
      logger.debug('Active resources found', { count: result.length });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find active resources:', {
        error: err.message,
        stack: err.stack,
      });
      throw error;
    }
  }

  public async findByType(
    type: 'module' | 'api' | 'page' | 'ui' | 'feature',
  ): Promise<IResource[]> {
    try {
      logger.debug('Finding resources by type', { type });
      const result = await this.model
        .find({ type })
        .sort({ createdAt: -1 })
        .exec();
      logger.debug('Resources found by type', { type, count: result.length });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find resources by type:', {
        error: err.message,
        stack: err.stack,
        type,
      });
      throw error;
    }
  }

  public async findByParentId(parentId: string): Promise<IResource[]> {
    try {
      logger.debug('Finding resources by parent ID', { parentId });
      const result = await this.model
        .find({ parentId })
        .sort({ createdAt: -1 })
        .exec();
      logger.debug('Resources found by parent ID', {
        parentId,
        count: result.length,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find resources by parent ID:', {
        error: err.message,
        stack: err.stack,
        parentId,
      });
      throw error;
    }
  }

  public async findWithPagination(
    filter: FilterQuery<IResource> = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<{ resources: IResource[]; total: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const baseFilter = { ...filter };

      logger.debug('Finding resources with pagination', {
        filter: baseFilter,
        page,
        limit,
        skip,
      });

      const [resources, total] = await Promise.all([
        this.model
          .find(baseFilter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.model.countDocuments(baseFilter).exec(),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.debug('Resources found with pagination', {
        count: resources.length,
        total,
        totalPages,
        page,
        limit,
      });

      return { resources, total, totalPages };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find resources with pagination:', {
        error: err.message,
        stack: err.stack,
        filter,
        page,
        limit,
      });
      throw error;
    }
  }

  public async update(
    id: string,
    data: Partial<IResource>,
  ): Promise<IResource | null> {
    try {
      logger.debug('Updating resource', { id, data });
      const result = await this.updateById(id, data);
      logger.debug('Resource updated', { id, updated: !!result });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update resource:', {
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
      logger.debug('Deleting resource', { id });
      const result = await this.deleteById(id);
      const deleted = !!result;
      logger.debug('Resource deletion completed', { id, deleted });
      return deleted;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete resource:', {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }
}
