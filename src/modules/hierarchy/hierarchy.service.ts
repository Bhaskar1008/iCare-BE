import { HierarchyRepository } from '@/modules/hierarchy/hierarchy.repository';
import type { CreateHierarchyDto } from '@/modules/hierarchy/dto/create-hierarchy.dto';
import type { UpdateHierarchyDto } from '@/modules/hierarchy/dto/update-hierarchy.dto';
import type { HierarchyResponseDto } from '@/modules/hierarchy/dto/hierarchy-response.dto';
import type {
  IHierarchyService,
  HierarchyListResponseDto,
} from '@/modules/hierarchy/interfaces/hierarchy.interface';
import type { IHierarchy } from '@/models/hierarchy.model';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';
import { ChannelModel } from '@/models/channel.model';
import { Types, type FilterQuery } from 'mongoose';
import { HIERARCHY } from '@/common/constants/http-status.constants';
import logger from '@/common/utils/logger';

export class HierarchyService implements IHierarchyService {
  private hierarchyRepository: HierarchyRepository;

  constructor() {
    this.hierarchyRepository = new HierarchyRepository();
  }

  public async createHierarchy(
    data: CreateHierarchyDto,
  ): Promise<HierarchyResponseDto> {
    try {
      logger.debug('Creating hierarchy', { data });

      await this.validateChannelExists(data.channelId);
      await this.validateLevelCodeUniqueness(
        data.channelId,
        data.hierarchyLevelCode,
      );
      await this.validateHierarchyLevel(data);

      const hierarchyData = this.buildHierarchyCreateData(data);
      const hierarchy = await this.hierarchyRepository.create(hierarchyData);

      logger.info('Hierarchy created successfully', {
        id: hierarchy._id,
        levelCode: hierarchy.hierarchyLevelCode,
        channelId: data.channelId,
      });

      return this.mapToResponseDto(hierarchy);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create hierarchy:', {
        error: err.message,
        stack: err.stack,
        data,
      });
      throw error;
    }
  }

  private async validateChannelExists(channelId: string): Promise<void> {
    const channel = await ChannelModel.findById(channelId);
    if (!channel || channel.isDeleted) {
      throw new DatabaseValidationException('Channel not found or deleted');
    }
  }

  private async validateLevelCodeUniqueness(
    channelId: string,
    levelCode: string,
  ): Promise<void> {
    const existingHierarchy = await this.hierarchyRepository.findByLevelCode(
      channelId,
      levelCode,
    );
    if (existingHierarchy) {
      throw new DatabaseValidationException(
        `Hierarchy with level code '${levelCode}' already exists in this channel`,
      );
    }
  }

  private async validateHierarchyLevel(
    data: CreateHierarchyDto,
  ): Promise<void> {
    if (data.hierarchyParentId) {
      const parent = await this.hierarchyRepository.findById(
        data.hierarchyParentId,
      );
      if (!parent || parent.isDeleted) {
        throw new DatabaseValidationException('Parent hierarchy not found');
      }

      const parentChannelId = (parent.channelId as Types.ObjectId).toString();
      if (parentChannelId !== data.channelId) {
        throw new DatabaseValidationException(
          'Parent hierarchy must belong to the same channel',
        );
      }

      if (data.hierarchyLevel !== parent.hierarchyLevel + 1) {
        throw new DatabaseValidationException(
          'Hierarchy level must be exactly one level below parent',
        );
      }
    } else if (data.hierarchyLevel !== HIERARCHY.MIN_LEVEL) {
      throw new DatabaseValidationException(
        `Root hierarchy must have level ${HIERARCHY.MIN_LEVEL}`,
      );
    }
  }

  private buildHierarchyCreateData(
    data: CreateHierarchyDto,
  ): Partial<IHierarchy> {
    return {
      channelId: new Types.ObjectId(data.channelId),
      hierarchyName: data.hierarchyName.trim(),
      hierarchyLevelCode: data.hierarchyLevelCode.toUpperCase().trim(),
      hierarchyLevel: data.hierarchyLevel,
      hierarchyParentId: data.hierarchyParentId
        ? new Types.ObjectId(data.hierarchyParentId)
        : undefined,
      hierarchyDescription: data.hierarchyDescription?.trim(),
      hierarchyOrder: data.hierarchyOrder ?? HIERARCHY.DEFAULT_ORDER,
      hierarchyStatus: data.hierarchyStatus ?? 'active',
    };
  }

  public async getHierarchyById(
    id: string,
  ): Promise<HierarchyResponseDto | null> {
    try {
      logger.debug('Getting hierarchy by ID', { id });
      const hierarchy = await this.hierarchyRepository.findById(id);

      if (!hierarchy || hierarchy.isDeleted) {
        logger.debug('Hierarchy not found or deleted', { id });
        return null;
      }

      logger.debug('Hierarchy found by ID', {
        id,
        levelCode: hierarchy.hierarchyLevelCode,
      });
      return this.mapToResponseDto(hierarchy);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get hierarchy by ID:', {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }

  public async getHierarchiesByChannel(
    channelId: string,
  ): Promise<HierarchyResponseDto[]> {
    try {
      logger.debug('Getting hierarchies by channel', { channelId });
      const hierarchies =
        await this.hierarchyRepository.findByChannel(channelId);

      logger.debug('Hierarchies found by channel', {
        channelId,
        count: hierarchies.length,
      });
      return hierarchies.map(hierarchy => this.mapToResponseDto(hierarchy));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get hierarchies by channel:', {
        error: err.message,
        stack: err.stack,
        channelId,
      });
      throw error;
    }
  }

  public async getHierarchiesByChannelAndLevel(
    channelId: string,
    level: number,
  ): Promise<HierarchyResponseDto[]> {
    try {
      logger.debug('Getting hierarchies by channel and level', {
        channelId,
        level,
      });
      const hierarchies = await this.hierarchyRepository.findByChannelAndLevel(
        channelId,
        level,
      );

      logger.debug('Hierarchies found by channel and level', {
        channelId,
        level,
        count: hierarchies.length,
      });
      return hierarchies.map(hierarchy => this.mapToResponseDto(hierarchy));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get hierarchies by channel and level:', {
        error: err.message,
        stack: err.stack,
        channelId,
        level,
      });
      throw error;
    }
  }

  public async getRootHierarchies(
    channelId: string,
  ): Promise<HierarchyResponseDto[]> {
    try {
      logger.debug('Getting root hierarchies', { channelId });
      const hierarchies =
        await this.hierarchyRepository.findRootHierarchies(channelId);

      logger.debug('Root hierarchies found', {
        channelId,
        count: hierarchies.length,
      });
      return hierarchies.map(hierarchy => this.mapToResponseDto(hierarchy));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get root hierarchies:', {
        error: err.message,
        stack: err.stack,
        channelId,
      });
      throw error;
    }
  }

  public async getChildHierarchies(
    parentId: string,
  ): Promise<HierarchyResponseDto[]> {
    try {
      logger.debug('Getting child hierarchies', { parentId });
      const hierarchies = await this.hierarchyRepository.findChildren(parentId);

      logger.debug('Child hierarchies found', {
        parentId,
        count: hierarchies.length,
      });
      return hierarchies.map(hierarchy => this.mapToResponseDto(hierarchy));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get child hierarchies:', {
        error: err.message,
        stack: err.stack,
        parentId,
      });
      throw error;
    }
  }

  public async getAllHierarchies(
    page: number = 1,
    limit: number = 10,
    channelId?: string,
    level?: number,
    status?: 'active' | 'inactive',
  ): Promise<HierarchyListResponseDto> {
    try {
      logger.debug('Getting all hierarchies', {
        page,
        limit,
        channelId,
        level,
        status,
      });

      const result = await this.fetchHierarchiesWithPagination(
        page,
        limit,
        channelId,
        level,
        status,
      );
      const mappedResult = this.buildHierarchyListResponse(result, page, limit);

      logger.debug('Hierarchies retrieved successfully', {
        count: result.hierarchies.length,
        total: result.total,
        page,
        limit,
      });

      return mappedResult;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get all hierarchies:', {
        error: err.message,
        stack: err.stack,
        page,
        limit,
        channelId,
        level,
        status,
      });
      throw error;
    }
  }

  private async fetchHierarchiesWithPagination(
    page: number,
    limit: number,
    channelId?: string,
    level?: number,
    status?: 'active' | 'inactive',
  ): Promise<{ hierarchies: IHierarchy[]; total: number; totalPages: number }> {
    const filter = this.buildFilterQuery(channelId, level, status);
    return await this.hierarchyRepository.findWithPagination(
      filter,
      page,
      limit,
    );
  }

  private buildHierarchyListResponse(
    result: { hierarchies: IHierarchy[]; total: number; totalPages: number },
    page: number,
    limit: number,
  ): HierarchyListResponseDto {
    return {
      hierarchies: result.hierarchies.map(hierarchy =>
        this.mapToResponseDto(hierarchy),
      ),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  private buildFilterQuery(
    channelId?: string,
    level?: number,
    status?: 'active' | 'inactive',
  ): FilterQuery<IHierarchy> {
    const filter: FilterQuery<IHierarchy> = {};
    if (channelId) {
      filter.channelId = new Types.ObjectId(channelId);
    }
    if (level) {
      filter.hierarchyLevel = level;
    }
    if (status) {
      filter.hierarchyStatus = status;
    }
    return filter;
  }

  public async updateHierarchy(
    id: string,
    data: UpdateHierarchyDto,
  ): Promise<HierarchyResponseDto | null> {
    try {
      logger.debug('Updating hierarchy', { id, data });

      const existingHierarchy = await this.hierarchyRepository.findById(id);
      if (!existingHierarchy || existingHierarchy.isDeleted) {
        logger.debug('Hierarchy not found for update', { id });
        return null;
      }

      await this.validateLevelCodeForUpdate(existingHierarchy, data, id);
      const updateData = this.buildUpdateData(data);
      const updatedHierarchy = await this.hierarchyRepository.updateById(
        id,
        updateData,
      );

      if (!updatedHierarchy) {
        logger.debug('Hierarchy not found after update', { id });
        return null;
      }

      logger.info('Hierarchy updated successfully', {
        id,
        levelCode: updatedHierarchy.hierarchyLevelCode,
      });
      return this.mapToResponseDto(updatedHierarchy);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update hierarchy:', {
        error: err.message,
        stack: err.stack,
        id,
        data,
      });
      throw error;
    }
  }

  private async validateLevelCodeForUpdate(
    existingHierarchy: IHierarchy,
    data: UpdateHierarchyDto,
    id: string,
  ): Promise<void> {
    if (
      data.hierarchyLevelCode &&
      data.hierarchyLevelCode !== existingHierarchy.hierarchyLevelCode
    ) {
      const channelId = (
        existingHierarchy.channelId as Types.ObjectId
      ).toString();
      const conflictingHierarchy =
        await this.hierarchyRepository.findByLevelCode(
          channelId,
          data.hierarchyLevelCode,
        );
      if (conflictingHierarchy && conflictingHierarchy._id.toString() !== id) {
        throw new DatabaseValidationException(
          `Hierarchy with level code '${data.hierarchyLevelCode}' already exists in this channel`,
        );
      }
    }
  }

  private buildUpdateData(data: UpdateHierarchyDto): Partial<IHierarchy> {
    const updateData: Partial<IHierarchy> = {};
    if (data.hierarchyName) {
      updateData.hierarchyName = data.hierarchyName.trim();
    }
    if (data.hierarchyLevelCode) {
      updateData.hierarchyLevelCode = data.hierarchyLevelCode
        .toUpperCase()
        .trim();
    }
    if (data.hierarchyDescription !== undefined) {
      updateData.hierarchyDescription = data.hierarchyDescription?.trim();
    }
    if (data.hierarchyOrder !== undefined) {
      updateData.hierarchyOrder = data.hierarchyOrder;
    }
    if (data.hierarchyStatus) {
      updateData.hierarchyStatus = data.hierarchyStatus;
    }
    return updateData;
  }

  public async deleteHierarchy(id: string): Promise<boolean> {
    try {
      logger.debug('Deleting hierarchy', { id });

      const hierarchy = await this.hierarchyRepository.findById(id);
      if (!hierarchy || hierarchy.isDeleted) {
        logger.debug('Hierarchy not found for deletion', { id });
        return false;
      }

      // Check if hierarchy has children
      const children = await this.hierarchyRepository.findChildren(id);
      if (children.length > 0) {
        throw new DatabaseValidationException(
          'Cannot delete hierarchy with child hierarchies. Delete children first.',
        );
      }

      // Soft delete
      const updatedHierarchy = await this.hierarchyRepository.updateById(id, {
        isDeleted: true,
        deletedAt: new Date(),
      });

      logger.info('Hierarchy deleted successfully', {
        id,
        deleted: !!updatedHierarchy,
      });
      return !!updatedHierarchy;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete hierarchy:', {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }

  private mapToResponseDto(hierarchy: IHierarchy): HierarchyResponseDto {
    const channelInfo = hierarchy.channelId as {
      _id: string;
      channelName?: string;
      channelCode?: string;
    } | null;

    const parentInfo = hierarchy.hierarchyParentId
      ? (hierarchy.hierarchyParentId as {
          _id: string;
          hierarchyName?: string;
          hierarchyLevelCode?: string;
        })
      : null;

    const parentId = hierarchy.hierarchyParentId
      ? typeof hierarchy.hierarchyParentId === 'string'
        ? hierarchy.hierarchyParentId
        : (hierarchy.hierarchyParentId as Types.ObjectId).toString()
      : undefined;

    return {
      _id: hierarchy._id.toString(),
      channelName: channelInfo?.channelName,
      channelCode: channelInfo?.channelCode,
      hierarchyName: hierarchy.hierarchyName,
      hierarchyLevelCode: hierarchy.hierarchyLevelCode,
      hierarchyLevel: hierarchy.hierarchyLevel,
      hierarchyParentId: parentId,
      parentName: parentInfo?.hierarchyName,
      hierarchyDescription: hierarchy.hierarchyDescription,
      hierarchyOrder: hierarchy.hierarchyOrder,
      hierarchyStatus: hierarchy.hierarchyStatus,
      isActive: hierarchy.hierarchyStatus === 'active',
      isRoot: !hierarchy.hierarchyParentId,
      hasParent: !!hierarchy.hierarchyParentId,
      createdAt: hierarchy.createdAt,
      updatedAt: hierarchy.updatedAt,
    };
  }
}
