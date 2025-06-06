import { BaseRepository } from '@/repository/base.repository';
import { HierarchyModel, type IHierarchy } from '@/models/hierarchy.model';
import type { IHierarchyRepository } from '@/modules/hierarchy/interfaces/hierarchy.interface';
import type { FilterQuery } from 'mongoose';
import { Types } from 'mongoose';
import logger from '@/common/utils/logger';

export class HierarchyRepository
  extends BaseRepository<IHierarchy>
  implements IHierarchyRepository
{
  constructor() {
    super(HierarchyModel);
  }

  public async findByChannel(channelId: string): Promise<IHierarchy[]> {
    try {
      logger.debug('Finding hierarchies by channel', { channelId });
      const hierarchies = await this.model
        .find({
          channelId: new Types.ObjectId(channelId),
          isDeleted: false,
        })
        .populate('channelId', 'channelName channelCode')
        .populate('hierarchyParentId', 'hierarchyName hierarchyLevelCode')
        .sort({ hierarchyLevel: 1, hierarchyOrder: 1 })
        .exec();

      logger.debug('Hierarchies found by channel', {
        channelId,
        count: hierarchies.length,
      });
      return hierarchies;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find hierarchies by channel:', {
        error: err.message,
        stack: err.stack,
        channelId,
      });
      throw err;
    }
  }

  public async findByChannelAndLevel(
    channelId: string,
    level: number,
  ): Promise<IHierarchy[]> {
    try {
      logger.debug('Finding hierarchies by channel and level', {
        channelId,
        level,
      });
      const hierarchies = await this.model
        .find({
          channelId: new Types.ObjectId(channelId),
          hierarchyLevel: level,
          isDeleted: false,
        })
        .populate('channelId', 'channelName channelCode')
        .populate('hierarchyParentId', 'hierarchyName hierarchyLevelCode')
        .sort({ hierarchyOrder: 1 })
        .exec();

      logger.debug('Hierarchies found by channel and level', {
        channelId,
        level,
        count: hierarchies.length,
      });
      return hierarchies;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find hierarchies by channel and level:', {
        error: err.message,
        stack: err.stack,
        channelId,
        level,
      });
      throw err;
    }
  }

  public async findChildren(parentId: string): Promise<IHierarchy[]> {
    try {
      logger.debug('Finding child hierarchies', { parentId });
      const children = await this.model
        .find({
          hierarchyParentId: new Types.ObjectId(parentId),
          isDeleted: false,
        })
        .populate('channelId', 'channelName channelCode')
        .sort({ hierarchyOrder: 1 })
        .exec();

      logger.debug('Child hierarchies found', {
        parentId,
        count: children.length,
      });
      return children;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find child hierarchies:', {
        error: err.message,
        stack: err.stack,
        parentId,
      });
      throw err;
    }
  }

  public async findRootHierarchies(channelId: string): Promise<IHierarchy[]> {
    try {
      logger.debug('Finding root hierarchies', { channelId });
      const roots = await this.model
        .find({
          channelId: new Types.ObjectId(channelId),
          hierarchyParentId: null,
          isDeleted: false,
        })
        .populate('channelId', 'channelName channelCode')
        .sort({ hierarchyOrder: 1 })
        .exec();

      logger.debug('Root hierarchies found', {
        channelId,
        count: roots.length,
      });
      return roots;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find root hierarchies:', {
        error: err.message,
        stack: err.stack,
        channelId,
      });
      throw err;
    }
  }

  public async findByLevelCode(
    channelId: string,
    levelCode: string,
  ): Promise<IHierarchy | null> {
    try {
      logger.debug('Finding hierarchy by level code', { channelId, levelCode });
      const hierarchy = await this.model
        .findOne({
          channelId: new Types.ObjectId(channelId),
          hierarchyLevelCode: levelCode.toUpperCase(),
          isDeleted: false,
        })
        .populate('channelId', 'channelName channelCode')
        .populate('hierarchyParentId', 'hierarchyName hierarchyLevelCode')
        .exec();

      logger.debug('Hierarchy found by level code', {
        channelId,
        levelCode,
        found: !!hierarchy,
      });
      return hierarchy;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find hierarchy by level code:', {
        error: err.message,
        stack: err.stack,
        channelId,
        levelCode,
      });
      throw err;
    }
  }

  public async findWithPagination(
    filter: FilterQuery<IHierarchy> = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    hierarchies: IHierarchy[];
    total: number;
    totalPages: number;
  }> {
    try {
      logger.debug('Finding hierarchies with pagination', {
        filter,
        page,
        limit,
      });

      const paginationData = this.buildPaginationQuery(filter, page, limit);
      const result = await this.executePaginationQuery(paginationData);

      logger.debug('Hierarchies found with pagination', {
        filter,
        page,
        limit,
        count: result.hierarchies.length,
        total: result.total,
        totalPages: result.totalPages,
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find hierarchies with pagination:', {
        error: err.message,
        stack: err.stack,
        filter,
        page,
        limit,
      });
      throw err;
    }
  }

  private buildPaginationQuery(
    filter: FilterQuery<IHierarchy>,
    page: number,
    limit: number,
  ): { searchFilter: FilterQuery<IHierarchy>; skip: number; limit: number } {
    const skip = (page - 1) * limit;
    const searchFilter = { ...filter, isDeleted: false };
    return { searchFilter, skip, limit };
  }

  private async executePaginationQuery(paginationData: {
    searchFilter: FilterQuery<IHierarchy>;
    skip: number;
    limit: number;
  }): Promise<{
    hierarchies: IHierarchy[];
    total: number;
    totalPages: number;
  }> {
    const { searchFilter, skip, limit } = paginationData;

    const [hierarchies, total] = await Promise.all([
      this.model
        .find(searchFilter)
        .populate('channelId', 'channelName channelCode')
        .populate('hierarchyParentId', 'hierarchyName hierarchyLevelCode')
        .sort({ hierarchyLevel: 1, hierarchyOrder: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(searchFilter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);
    return { hierarchies, total, totalPages };
  }
}
