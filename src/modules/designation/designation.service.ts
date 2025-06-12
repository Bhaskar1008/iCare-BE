import { DesignationRepository } from '@/modules/designation/designation.repository';
import type { CreateDesignationDto } from '@/modules/designation/dto/create-designation.dto';
import type { IDesignation } from '@/models/designation.model';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';
import logger from '@/common/utils/logger';
import { Types } from 'mongoose';
import type {
  IDesignationService,
  IDesignationRepository,
} from '@/modules/designation/interfaces/designation.interface';
import type { DesignationResponseDto } from '@/modules/designation/dto/designation-response.dto';
import type {
  ChannelResponseDto,
  RoleResponseDto,
  HierarchyResponseDto,
} from '@/modules/designation/dto/designation-response.dto';

export class DesignationService implements IDesignationService {
  private designationRepository: IDesignationRepository;

  constructor() {
    this.designationRepository = new DesignationRepository();
  }

  public async createDesignation(
    data: CreateDesignationDto,
  ): Promise<DesignationResponseDto> {
    try {
      logger.debug('Creating designation', { data });

      const existingDesignation = await this.designationRepository.findByCode(
        data.designationCode,
        data.channelId,
      );
      if (existingDesignation) {
        throw new DatabaseValidationException(
          `Designation with code '${data.designationCode}' already exists in this channel`,
        );
      }

      const designationData = {
        channelId: new Types.ObjectId(data.channelId),
        roleId: new Types.ObjectId(data.roleId),
        hierarchyId: new Types.ObjectId(data.hierarchyId),
        designationName: data.designationName,
        designationCode: data.designationCode,
        designationStatus: data.designationStatus ?? 'active',
        designationDescription: data.designationDescription,
        designationOrder: data.designationOrder ?? 0,
      };

      const designation =
        await this.designationRepository.create(designationData);
      logger.info('Designation created successfully', {
        id: designation._id,
        code: designation.designationCode,
      });

      return this.mapToResponseDto(designation);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create designation:', {
        error: err.message,
        stack: err.stack,
        data,
      });
      throw error;
    }
  }

  public async getDesignationById(
    id: string,
    populate: boolean = false,
  ): Promise<DesignationResponseDto | null> {
    try {
      logger.debug('Getting designation by ID', { id, populate });
      const designation = await this.designationRepository.findById(
        id,
        populate,
      );

      if (!designation || designation.isDeleted) {
        logger.debug('Designation not found or deleted', { id });
        return null;
      }

      logger.debug('Designation found by ID', {
        id,
        code: designation.designationCode,
        populate,
      });
      return this.mapToResponseDto(designation);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get designation by ID:', {
        error: err.message,
        stack: err.stack,
        id,
        populate,
      });
      throw error;
    }
  }

  public async getDesignationByCode(
    code: string,
    channelId: string,
    populate: boolean = false,
  ): Promise<DesignationResponseDto | null> {
    try {
      logger.debug('Getting designation by code and channel ID', {
        code,
        channelId,
        populate,
      });
      const designation = await this.designationRepository.findByCode(
        code,
        channelId,
        populate,
      );

      if (!designation) {
        logger.debug('Designation not found by code and channel ID', {
          code,
          channelId,
        });
        return null;
      }

      logger.debug('Designation found by code and channel ID', {
        code,
        channelId,
        id: designation._id,
        populate,
      });
      return this.mapToResponseDto(designation);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get designation by code and channel ID:', {
        error: err.message,
        stack: err.stack,
        code,
        channelId,
        populate,
      });
      throw error;
    }
  }

  private buildDesignationFilter(
    status?: 'active' | 'inactive',
    channelId?: string,
    roleId?: string,
    hierarchyId?: string,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (status) {
      filter.designationStatus = status;
    }

    if (channelId) {
      filter.channelId = new Types.ObjectId(channelId);
    }

    if (roleId) {
      filter.roleId = new Types.ObjectId(roleId);
    }

    if (hierarchyId) {
      filter.hierarchyId = new Types.ObjectId(hierarchyId);
    }

    return filter;
  }

  private formatDesignationResult(
    result: {
      designations: IDesignation[];
      total: number;
      totalPages: number;
    },
    page: number,
    limit: number,
  ): {
    designations: DesignationResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } {
    return {
      designations: result.designations.map(designation =>
        this.mapToResponseDto(designation),
      ),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  private async getDesignationsWithFilter(
    filter: Record<string, unknown>,
    page: number,
    limit: number,
    populate: boolean,
  ): Promise<{
    designations: DesignationResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const result = await this.designationRepository.findWithPagination(
      filter,
      page,
      limit,
      populate,
    );

    logger.debug('Designations retrieved successfully', {
      count: result.designations.length,
      total: result.total,
      page,
      limit,
      populate,
    });

    return this.formatDesignationResult(result, page, limit);
  }

  private logGetAllDesignationsRequest(
    page: number,
    limit: number,
    status?: 'active' | 'inactive',
    channelId?: string,
    roleId?: string,
    hierarchyId?: string,
    populate?: boolean,
  ): void {
    logger.debug('Getting all designations', {
      page,
      limit,
      status,
      channelId,
      roleId,
      hierarchyId,
      populate,
    });
  }

  private handleGetAllDesignationsError(
    error: unknown,
    page: number,
    limit: number,
    status?: 'active' | 'inactive',
    channelId?: string,
    roleId?: string,
    hierarchyId?: string,
    populate?: boolean,
  ): never {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get all designations:', {
      error: err.message,
      stack: err.stack,
      page,
      limit,
      status,
      channelId,
      roleId,
      hierarchyId,
      populate,
    });
    throw error;
  }

  public async getAllDesignations(
    page: number = 1,
    limit: number = 10,
    status?: 'active' | 'inactive',
    channelId?: string,
    roleId?: string,
    hierarchyId?: string,
    populate: boolean = false,
  ): Promise<{
    designations: DesignationResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      this.logGetAllDesignationsRequest(
        page,
        limit,
        status,
        channelId,
        roleId,
        hierarchyId,
        populate,
      );

      const filter = this.buildDesignationFilter(
        status,
        channelId,
        roleId,
        hierarchyId,
      );

      return await this.getDesignationsWithFilter(
        filter,
        page,
        limit,
        populate,
      );
    } catch (error) {
      return this.handleGetAllDesignationsError(
        error,
        page,
        limit,
        status,
        channelId,
        roleId,
        hierarchyId,
        populate,
      );
    }
  }

  public async getActiveDesignations(
    populate: boolean = false,
  ): Promise<DesignationResponseDto[]> {
    try {
      logger.debug('Getting active designations', { populate });
      const designations =
        await this.designationRepository.findActiveDesignations(populate);

      logger.debug('Active designations retrieved successfully', {
        count: designations.length,
        populate,
      });
      return designations.map(designation =>
        this.mapToResponseDto(designation),
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get active designations:', {
        error: err.message,
        stack: err.stack,
        populate,
      });
      throw error;
    }
  }

  public async getDesignationsByChannelId(
    channelId: string,
    populate: boolean = false,
  ): Promise<DesignationResponseDto[]> {
    try {
      logger.debug('Getting designations by channel ID', {
        channelId,
        populate,
      });
      const designations = await this.designationRepository.findByChannelId(
        channelId,
        populate,
      );

      logger.debug('Designations retrieved by channel ID successfully', {
        count: designations.length,
        channelId,
        populate,
      });
      return designations.map(designation =>
        this.mapToResponseDto(designation),
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get designations by channel ID:', {
        error: err.message,
        stack: err.stack,
        channelId,
        populate,
      });
      throw error;
    }
  }

  public async getDesignationsByHierarchyId(
    hierarchyId: string,
    populate: boolean = false,
  ): Promise<DesignationResponseDto[]> {
    try {
      logger.debug('Getting designations by hierarchy ID', {
        hierarchyId,
        populate,
      });
      const designations = await this.designationRepository.findByHierarchyId(
        hierarchyId,
        populate,
      );

      logger.debug('Designations retrieved by hierarchy ID successfully', {
        count: designations.length,
        hierarchyId,
        populate,
      });
      return designations.map(designation =>
        this.mapToResponseDto(designation),
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get designations by hierarchy ID:', {
        error: err.message,
        stack: err.stack,
        hierarchyId,
        populate,
      });
      throw error;
    }
  }

  public async getDesignationsByRoleId(
    roleId: string,
    populate: boolean = false,
  ): Promise<DesignationResponseDto[]> {
    try {
      logger.debug('Getting designations by role ID', {
        roleId,
        populate,
      });
      const designations = await this.designationRepository.findByRoleId(
        roleId,
        populate,
      );

      logger.debug('Designations retrieved by role ID successfully', {
        count: designations.length,
        roleId,
        populate,
      });
      return designations.map(designation =>
        this.mapToResponseDto(designation),
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get designations by role ID:', {
        error: err.message,
        stack: err.stack,
        roleId,
        populate,
      });
      throw error;
    }
  }

  private convertIdToString(id: unknown): string {
    if (id instanceof Types.ObjectId) {
      return id.toString();
    }
    // Handle cases where id might be a populated document
    if (
      id &&
      typeof id === 'object' &&
      '_id' in id &&
      id._id instanceof Types.ObjectId
    ) {
      return id._id.toString();
    }
    return String(id);
  }

  private mapPopulatedChannel(channelId: unknown): ChannelResponseDto | string {
    // Check if channelId is populated
    const isPopulated =
      typeof channelId === 'object' &&
      channelId !== null &&
      !('_bsontype' in channelId);

    if (
      isPopulated &&
      channelId &&
      typeof channelId === 'object' &&
      '_id' in channelId
    ) {
      const channel = channelId as Record<string, unknown>;
      return {
        _id: this.convertIdToString(channel._id),

        channelName: channel.channelName as string,

        channelCode: channel.channelCode as string,

        channelStatus: channel.channelStatus as 'active' | 'inactive',
      };
    }

    return this.convertIdToString(channelId);
  }

  private mapPopulatedRole(roleId: unknown): RoleResponseDto | string {
    // Check if roleId is populated
    const isPopulated =
      typeof roleId === 'object' && roleId !== null && !('_bsontype' in roleId);

    if (
      isPopulated &&
      roleId &&
      typeof roleId === 'object' &&
      '_id' in roleId
    ) {
      const role = roleId as Record<string, unknown>;
      return {
        _id: this.convertIdToString(role._id),

        roleName: role.roleName as string,

        roleCode: role.roleCode as number,

        status: role.status as 'active' | 'inactive',
      };
    }

    return this.convertIdToString(roleId);
  }

  private mapPopulatedHierarchy(
    hierarchyId: unknown,
  ): HierarchyResponseDto | string {
    // Check if hierarchyId is populated
    const isPopulated =
      typeof hierarchyId === 'object' &&
      hierarchyId !== null &&
      !('_bsontype' in hierarchyId);

    if (
      isPopulated &&
      hierarchyId &&
      typeof hierarchyId === 'object' &&
      '_id' in hierarchyId
    ) {
      const hierarchy = hierarchyId as Record<string, unknown>;
      return {
        _id: this.convertIdToString(hierarchy._id),

        hierarchyName: hierarchy.hierarchyName as string,

        hierarchyLevelCode: hierarchy.hierarchyLevelCode as string,

        hierarchyLevel: hierarchy.hierarchyLevel as number,

        hierarchyStatus: hierarchy.hierarchyStatus as 'active' | 'inactive',
      };
    }

    return this.convertIdToString(hierarchyId);
  }

  private mapToResponseDto(designation: IDesignation): DesignationResponseDto {
    return {
      _id: designation._id,
      channel: this.mapPopulatedChannel(designation.channelId),
      role: this.mapPopulatedRole(designation.roleId),
      hierarchy: this.mapPopulatedHierarchy(designation.hierarchyId),
      designationName: designation.designationName,
      designationCode: designation.designationCode,
      designationStatus: designation.designationStatus,
      designationDescription: designation.designationDescription,
      designationOrder: designation.designationOrder,
      createdAt: designation.createdAt,
      updatedAt: designation.updatedAt,
    };
  }
}
