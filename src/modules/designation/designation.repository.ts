import { BaseRepository } from '@/repository/base.repository';
import {
  DesignationModel,
  type IDesignation,
} from '@/models/designation.model';
import type { FilterQuery } from 'mongoose';
import logger from '@/common/utils/logger';
import type { IDesignationRepository } from '@/modules/designation/interfaces/designation.interface';

export class DesignationRepository
  extends BaseRepository<IDesignation>
  implements IDesignationRepository
{
  constructor() {
    super(DesignationModel);
  }

  /**
   * Populates common fields on a designation query
   * @param query The mongoose query to populate
   * @returns The populated query
   */
  private populateDesignationFields(query: any): any {
    return query
      .populate('channelId', 'channelName channelCode channelStatus')
      .populate('roleId', 'roleName roleCode status')
      .populate(
        'hierarchyId',
        'hierarchyName hierarchyLevelCode hierarchyLevel hierarchyStatus',
      );
  }

  public async findById(
    id: string,
    populate: boolean = false,
  ): Promise<IDesignation | null> {
    try {
      logger.debug('Finding designation by ID', { id, populate });
      let query = this.model.findById(id);

      if (populate) {
        query = this.populateDesignationFields(query);
      }

      const result = await query.exec();
      logger.debug('Designation found by ID', {
        id,
        found: !!result,
        populate,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find designation by ID:', {
        error: err.message,
        stack: err.stack,
        id,
        populate,
      });
      throw error;
    }
  }

  public async findByCode(
    code: string,
    channelId: string,
    populate: boolean = false,
  ): Promise<IDesignation | null> {
    try {
      logger.debug('Finding designation by code and channel ID', {
        code,
        channelId,
        populate,
      });

      let query = this.model.findOne({
        designationCode: code,
        channelId,
        isDeleted: false,
      });

      if (populate) {
        query = this.populateDesignationFields(query);
      }

      const result = await query.exec();
      logger.debug('Designation found by code and channel ID', {
        code,
        channelId,
        found: !!result,
        populate,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find designation by code and channel ID:', {
        error: err.message,
        stack: err.stack,
        code,
        channelId,
        populate,
      });
      throw error;
    }
  }

  public async findActiveDesignations(
    populate: boolean = false,
  ): Promise<IDesignation[]> {
    try {
      logger.debug('Finding active designations', { populate });

      let query = this.model
        .find({ designationStatus: 'active', isDeleted: false })
        .sort({ createdAt: -1 });

      if (populate) {
        query = this.populateDesignationFields(query);
      }

      const result = await query.exec();
      logger.debug('Active designations found', {
        count: result.length,
        populate,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find active designations:', {
        error: err.message,
        stack: err.stack,
        populate,
      });
      throw error;
    }
  }

  public async findByChannelId(
    channelId: string,
    populate: boolean = false,
  ): Promise<IDesignation[]> {
    try {
      logger.debug('Finding designations by channel ID', {
        channelId,
        populate,
      });

      let query = this.model
        .find({ channelId, isDeleted: false })
        .sort({ createdAt: -1 });

      if (populate) {
        query = this.populateDesignationFields(query);
      }

      const result = await query.exec();
      logger.debug('Designations found by channel ID', {
        channelId,
        count: result.length,
        populate,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find designations by channel ID:', {
        error: err.message,
        stack: err.stack,
        channelId,
        populate,
      });
      throw error;
    }
  }

  public async findByHierarchyId(
    hierarchyId: string,
    populate: boolean = false,
  ): Promise<IDesignation[]> {
    try {
      logger.debug('Finding designations by hierarchy ID', {
        hierarchyId,
        populate,
      });

      let query = this.model
        .find({ hierarchyId, isDeleted: false })
        .sort({ createdAt: -1 });

      if (populate) {
        query = this.populateDesignationFields(query);
      }

      const result = await query.exec();
      logger.debug('Designations found by hierarchy ID', {
        hierarchyId,
        count: result.length,
        populate,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find designations by hierarchy ID:', {
        error: err.message,
        stack: err.stack,
        hierarchyId,
        populate,
      });
      throw error;
    }
  }

  public async findByRoleId(
    roleId: string,
    populate: boolean = false,
  ): Promise<IDesignation[]> {
    try {
      logger.debug('Finding designations by role ID', {
        roleId,
        populate,
      });

      let query = this.model
        .find({ roleId, isDeleted: false })
        .sort({ createdAt: -1 });

      if (populate) {
        query = this.populateDesignationFields(query);
      }

      const result = await query.exec();
      logger.debug('Designations found by role ID', {
        roleId,
        count: result.length,
        populate,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find designations by role ID:', {
        error: err.message,
        stack: err.stack,
        roleId,
        populate,
      });
      throw error;
    }
  }

  private async executeQueryWithPagination(
    baseFilter: FilterQuery<IDesignation>,
    skip: number,
    limit: number,
    populate: boolean = false,
  ): Promise<[IDesignation[], number]> {
    let query = this.model
      .find(baseFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (populate) {
      query = this.populateDesignationFields(query);
    }

    return Promise.all([
      query.exec(),
      this.model.countDocuments(baseFilter).exec(),
    ]);
  }

  // Extract part of findWithPagination to reduce method line count
  private buildPaginationResult(
    designations: IDesignation[],
    total: number,
    limit: number,
    page: number,
    populate: boolean,
  ): {
    designations: IDesignation[];
    total: number;
    totalPages: number;
  } {
    const totalPages = Math.ceil(total / limit);

    logger.debug('Designations found with pagination', {
      count: designations.length,
      total,
      totalPages,
      page,
      limit,
      populate,
    });

    return { designations, total, totalPages };
  }

  public async findWithPagination(
    filter: FilterQuery<IDesignation> = {},
    page: number = 1,
    limit: number = 10,
    populate: boolean = false,
  ): Promise<{
    designations: IDesignation[];
    total: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const baseFilter = { ...filter, isDeleted: false };

      logger.debug('Finding designations with pagination', {
        filter: baseFilter,
        page,
        limit,
        skip,
        populate,
      });

      const [designations, total] = await this.executeQueryWithPagination(
        baseFilter,
        skip,
        limit,
        populate,
      );

      return this.buildPaginationResult(
        designations,
        total,
        limit,
        page,
        populate,
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find designations with pagination:', {
        error: err.message,
        stack: err.stack,
        filter,
        page,
        limit,
        populate,
      });
      throw error;
    }
  }
}
