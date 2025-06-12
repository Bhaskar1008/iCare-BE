import { PermissionResourceRepository } from '@/modules/permissionResources/permissionResource.repository';
import type { CreatePermissionResourceDto } from '@/modules/permissionResources/dto/create-permission-resource.dto';
import type { UpdatePermissionResourceDto } from '@/modules/permissionResources/dto/update-permission-resource.dto';
import type { PermissionResourceResponseDto } from '@/modules/permissionResources/dto/permission-resource-response.dto';
import type { IResource } from '@/models/resource.model';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';
import logger from '@/common/utils/logger';
import { Types } from 'mongoose';
import type { FilterQuery } from 'mongoose';
import type {
  IPermissionResourceService,
  IPermissionResourceRepository,
} from '@/modules/permissionResources/interfaces/permission-resource.interface';

export class PermissionResourceService implements IPermissionResourceService {
  private resourceRepository: IPermissionResourceRepository;

  constructor() {
    this.resourceRepository = new PermissionResourceRepository();
  }

  public async createResource(
    data: CreatePermissionResourceDto,
  ): Promise<PermissionResourceResponseDto> {
    try {
      logger.debug('Creating resource', { data });

      const existingResource = await this.resourceRepository.findByIdentifier(
        data.identifier,
      );
      if (existingResource) {
        throw new DatabaseValidationException(
          `Resource with identifier '${data.identifier}' already exists`,
        );
      }

      const resourceData: Partial<IResource> = {
        name: data.name,
        identifier: data.identifier,
        type: data.type,
        parentId: data.parentId ? new Types.ObjectId(data.parentId) : undefined,
        status: data.status ?? 'active',
      };

      const resource = await this.resourceRepository.create(resourceData);
      logger.info('Resource created successfully', {
        id: resource._id,
        identifier: resource.identifier,
      });

      return this.mapToResponseDto(resource);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create resource:', {
        error: err.message,
        stack: err.stack,
        data,
      });
      throw error;
    }
  }

  public async getResourceById(
    id: string,
  ): Promise<PermissionResourceResponseDto | null> {
    try {
      logger.debug('Getting resource by ID', { id });
      const resource = await this.resourceRepository.findById(id);

      if (!resource || resource.isDeleted) {
        logger.debug('Resource not found or deleted', { id });
        return null;
      }

      logger.debug('Resource found by ID', {
        id,
        identifier: resource.identifier,
      });
      return this.mapToResponseDto(resource);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get resource by ID:', {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }

  public async getResourceByIdentifier(
    identifier: string,
  ): Promise<PermissionResourceResponseDto | null> {
    try {
      logger.debug('Getting resource by identifier', { identifier });
      const resource =
        await this.resourceRepository.findByIdentifier(identifier);

      if (!resource) {
        logger.debug('Resource not found by identifier', { identifier });
        return null;
      }

      logger.debug('Resource found by identifier', {
        identifier,
        id: resource._id,
      });
      return this.mapToResponseDto(resource);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get resource by identifier:', {
        error: err.message,
        stack: err.stack,
        identifier,
      });
      throw error;
    }
  }

  public async getAllResources(
    page: number = 1,
    limit: number = 10,
    status?: 'active' | 'inactive',
    type?: 'module' | 'api' | 'page' | 'ui' | 'feature',
    parentId?: string,
    search?: string,
  ): Promise<{
    resources: PermissionResourceResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      this.logResourceQueryParams(page, limit, status, type, parentId, search);
      return await this.processResourceQuery(
        page,
        limit,
        status,
        type,
        parentId,
        search,
      );
    } catch (error) {
      this.handleResourceQueryError(
        error,
        page,
        limit,
        status,
        type,
        parentId,
        search,
      );
      throw error;
    }
  }

  private logResourceQueryParams(
    page: number,
    limit: number,
    status?: 'active' | 'inactive',
    type?: 'module' | 'api' | 'page' | 'ui' | 'feature',
    parentId?: string,
    search?: string,
  ): void {
    logger.debug('Getting all resources', {
      page,
      limit,
      status,
      type,
      parentId,
      search,
    });
  }

  private async processResourceQuery(
    page: number,
    limit: number,
    status?: 'active' | 'inactive',
    type?: 'module' | 'api' | 'page' | 'ui' | 'feature',
    parentId?: string,
    search?: string,
  ): Promise<{
    resources: PermissionResourceResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const result = await this.fetchResourcesWithPagination(
      page,
      limit,
      status,
      type,
      parentId,
      search,
    );

    this.logResourcesRetrieved(result, page, limit);
    return this.formatResourcesResponse(result, page, limit);
  }

  private handleResourceQueryError(
    error: unknown,
    page: number,
    limit: number,
    status?: 'active' | 'inactive',
    type?: 'module' | 'api' | 'page' | 'ui' | 'feature',
    parentId?: string,
    search?: string,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get all resources:', {
      error: err.message,
      stack: err.stack,
      page,
      limit,
      status,
      type,
      parentId,
      search,
    });
  }

  private async fetchResourcesWithPagination(
    page: number,
    limit: number,
    status?: 'active' | 'inactive',
    type?: 'module' | 'api' | 'page' | 'ui' | 'feature',
    parentId?: string,
    search?: string,
  ): Promise<{ resources: IResource[]; total: number; totalPages: number }> {
    const filter: FilterQuery<IResource> = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (parentId) filter.parentId = parentId;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { identifier: { $regex: search, $options: 'i' } },
      ];
    }

    logger.debug('Fetching resources with pagination', { filter });

    return this.resourceRepository.findWithPagination(filter, page, limit);
  }

  private logResourcesRetrieved(
    result: { resources: IResource[]; total: number },
    page: number,
    limit: number,
  ): void {
    logger.debug('Resources retrieved successfully', {
      count: result.resources.length,
      total: result.total,
      page,
      limit,
    });
  }

  private formatResourcesResponse(
    result: { resources: IResource[]; total: number; totalPages: number },
    page: number,
    limit: number,
  ): {
    resources: PermissionResourceResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } {
    return {
      resources: result.resources.map(resource =>
        this.mapToResponseDto(resource),
      ),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  public async getActiveResources(): Promise<PermissionResourceResponseDto[]> {
    try {
      logger.debug('Getting active resources');
      const resources = await this.resourceRepository.findActiveResources();

      logger.debug('Active resources retrieved successfully', {
        count: resources.length,
      });
      return resources.map(resource => this.mapToResponseDto(resource));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get active resources:', {
        error: err.message,
        stack: err.stack,
      });
      throw error;
    }
  }

  public async getResourcesByType(
    type: 'module' | 'api' | 'page' | 'ui' | 'feature',
  ): Promise<PermissionResourceResponseDto[]> {
    try {
      logger.debug('Getting resources by type', { type });
      const resources = await this.resourceRepository.findByType(type);

      logger.debug('Resources retrieved by type successfully', {
        type,
        count: resources.length,
      });
      return resources.map(resource => this.mapToResponseDto(resource));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get resources by type:', {
        error: err.message,
        stack: err.stack,
        type,
      });
      throw error;
    }
  }

  public async getResourcesByParentId(
    parentId: string,
  ): Promise<PermissionResourceResponseDto[]> {
    try {
      logger.debug('Getting resources by parent ID', { parentId });
      const resources = await this.resourceRepository.findByParentId(parentId);

      logger.debug('Resources retrieved by parent ID successfully', {
        parentId,
        count: resources.length,
      });
      return resources.map(resource => this.mapToResponseDto(resource));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get resources by parent ID:', {
        error: err.message,
        stack: err.stack,
        parentId,
      });
      throw error;
    }
  }

  public async updateResource(
    id: string,
    data: UpdatePermissionResourceDto,
  ): Promise<PermissionResourceResponseDto | null> {
    try {
      logger.debug('Updating resource', { id, data });

      const existingResource = await this.findExistingResource(id);
      if (!existingResource) {
        return null;
      }

      await this.validateResourceUpdate(id, data, existingResource);
      const updateData = this.buildResourceUpdateData(data);
      const updatedResource = await this.performResourceUpdate(id, updateData);

      if (!updatedResource) {
        logger.debug('Resource update failed', { id });
        return null;
      }

      this.logResourceUpdated(id, updatedResource);
      return this.mapToResponseDto(updatedResource);
    } catch (error) {
      this.logResourceUpdateError(error, id, data);
      throw error;
    }
  }

  private async findExistingResource(id: string): Promise<IResource | null> {
    const existingResource = await this.resourceRepository.findById(id);
    if (!existingResource || existingResource.isDeleted) {
      logger.debug('Resource not found for update', { id });
      return null;
    }
    return existingResource;
  }

  private async validateResourceUpdate(
    id: string,
    data: UpdatePermissionResourceDto,
    existingResource: IResource,
  ): Promise<void> {
    if (data.identifier && data.identifier !== existingResource.identifier) {
      await this.checkIdentifierConflict(id, data.identifier);
    }
  }

  private async checkIdentifierConflict(
    id: string,
    identifier: string,
  ): Promise<void> {
    const resourceWithIdentifier =
      await this.resourceRepository.findByIdentifier(identifier);
    if (
      resourceWithIdentifier &&
      resourceWithIdentifier._id.toString() !== id
    ) {
      throw new DatabaseValidationException(
        `Resource with identifier '${identifier}' already exists`,
      );
    }
  }

  private buildResourceUpdateData(
    data: UpdatePermissionResourceDto,
  ): Partial<IResource> {
    return {
      name: data.name,
      identifier: data.identifier,
      type: data.type,
      status: data.status,
      parentId: data.parentId ? new Types.ObjectId(data.parentId) : undefined,
    };
  }

  private async performResourceUpdate(
    id: string,
    updateData: Partial<IResource>,
  ): Promise<IResource | null> {
    return this.resourceRepository.update(id, updateData);
  }

  private logResourceUpdated(id: string, updatedResource: IResource): void {
    logger.info('Resource updated successfully', {
      id,
      identifier: updatedResource.identifier,
    });
  }

  private logResourceUpdateError(
    error: unknown,
    id: string,
    data: UpdatePermissionResourceDto,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update resource:', {
      error: err.message,
      stack: err.stack,
      id,
      data,
    });
  }

  public async deleteResource(id: string): Promise<boolean> {
    try {
      logger.debug('Deleting resource', { id });

      const existingResource = await this.resourceRepository.findById(id);
      if (!existingResource || existingResource.isDeleted) {
        logger.debug('Resource not found for deletion', { id });
        return false;
      }

      const deleted = await this.resourceRepository.delete(id);
      logger.info('Resource deletion completed', { id, deleted });

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

  private mapToResponseDto(resource: IResource): PermissionResourceResponseDto {
    return {
      _id: resource._id.toString(),
      name: resource.name,
      identifier: resource.identifier,
      type: resource.type,
      parentId: resource.parentId?.toString(),
      status: resource.status,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    };
  }
}
