import type { Request, Response } from 'express';
import { BaseController } from '@/controllers/base.controller';
import { PermissionResourceService } from '@/modules/permissionResources/permissionResource.service';
import type { CreatePermissionResourceDto } from '@/modules/permissionResources/dto/create-permission-resource.dto';
import type { UpdatePermissionResourceDto } from '@/modules/permissionResources/dto/update-permission-resource.dto';
import type { PermissionResourceQueryDto } from '@/modules/permissionResources/dto/permission-resource-query.dto';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';
import {
  HTTP_STATUS,
  PAGINATION,
} from '@/common/constants/http-status.constants';
import logger from '@/common/utils/logger';
import type {
  IPermissionResourceController,
  IPermissionResourceService,
} from '@/modules/permissionResources/interfaces/permission-resource.interface';
import type { ValidatedRequest } from '@/common/interfaces/validation.interface';

export class PermissionResourceController
  extends BaseController
  implements IPermissionResourceController
{
  private resourceService: IPermissionResourceService;

  constructor() {
    super();
    this.resourceService = new PermissionResourceService();
  }

  public createResource = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const resourceData = req.body as CreatePermissionResourceDto;
      logger.debug('Create resource request received', { resourceData });

      const resource = await this.resourceService.createResource(resourceData);

      logger.info('Resource created successfully', {
        id: resource._id,
        identifier: resource.identifier,
      });

      this.sendSuccess(
        res,
        resource,
        'Resource created successfully',
        HTTP_STATUS.CREATED,
      );
    } catch (error) {
      this.handleCreateResourceError(error, req, res);
    }
  };

  private handleCreateResourceError(
    error: unknown,
    req: Request,
    res: Response,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to create resource:', {
      error: err.message,
      stack: err.stack,
    });

    if (error instanceof DatabaseValidationException) {
      this.sendBadRequest(res, err.message);
      return;
    }

    this.sendError(
      res,
      'Failed to create resource',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }

  public getResourceById = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Get resource by ID request received', { id });

      if (!id) {
        this.sendBadRequest(res, 'Resource ID is required');
        return;
      }

      const resource = await this.resourceService.getResourceById(id);

      if (!resource) {
        this.sendNotFound(res, 'Resource not found');
        return;
      }

      logger.debug('Resource retrieved successfully', {
        id,
        identifier: resource.identifier,
      });
      this.sendSuccess(res, resource, 'Resource retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get resource by ID:', {
        error: err.message,
        stack: err.stack,
        id: req.params.id,
      });

      this.sendError(
        res,
        'Failed to retrieve resource',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getResourceByIdentifier = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { identifier } = req.params;
      logger.debug('Get resource by identifier request received', {
        identifier,
      });

      if (!identifier) {
        this.sendBadRequest(res, 'Resource identifier is required');
        return;
      }

      const resource =
        await this.resourceService.getResourceByIdentifier(identifier);

      if (!resource) {
        this.sendNotFound(res, 'Resource not found');
        return;
      }

      logger.debug('Resource retrieved successfully', {
        identifier,
        id: resource._id,
      });
      this.sendSuccess(res, resource, 'Resource retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get resource by identifier:', {
        error: err.message,
        stack: err.stack,
        identifier: req.params.identifier,
      });

      this.sendError(
        res,
        'Failed to retrieve resource',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getAllResources = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Get all resources request received', { query: req.query });

      const queryParams = this.extractResourceQueryParams(req);
      const result = await this.resourceService.getAllResources(
        queryParams.page,
        queryParams.limit,
        queryParams.status,
        queryParams.type,
        queryParams.parentId,
        queryParams.search,
      );

      this.logResourcesRetrieved(result, queryParams.page, queryParams.limit);
      this.sendSuccess(res, result, 'Resources retrieved successfully');
    } catch (error) {
      this.handleGetAllResourcesError(error, req, res);
    }
  };

  private extractResourceQueryParams(req: Request): {
    page: number;
    limit: number;
    status?: 'active' | 'inactive';
    type?: 'module' | 'api' | 'page' | 'ui' | 'feature';
    parentId?: string;
    search?: string;
  } {
    const queryParams = (req as ValidatedRequest<PermissionResourceQueryDto>)
      .validatedQuery;

    return {
      page: queryParams.page
        ? parseInt(queryParams.page, 10)
        : PAGINATION.DEFAULT_PAGE,
      limit: queryParams.limit
        ? parseInt(queryParams.limit, 10)
        : PAGINATION.DEFAULT_LIMIT,
      status: queryParams.status,
      type: queryParams.type,
      parentId: queryParams.parentId,
      search: queryParams.search,
    };
  }

  private logResourcesRetrieved(
    result: { resources: unknown[]; pagination: { total: number } },
    page: number,
    limit: number,
  ): void {
    logger.debug('Resources retrieved successfully', {
      count: result.resources.length,
      total: result.pagination.total,
      page,
      limit,
    });
  }

  private handleGetAllResourcesError(
    error: unknown,
    req: Request,
    res: Response,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get all resources:', {
      error: err.message,
      stack: err.stack,
      query: req.query,
    });

    this.sendError(
      res,
      'Failed to retrieve resources',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }

  public getActiveResources = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Get active resources request received');

      const resources = await this.resourceService.getActiveResources();

      logger.debug('Active resources retrieved successfully', {
        count: resources.length,
      });

      this.sendSuccess(
        res,
        resources,
        'Active resources retrieved successfully',
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get active resources:', {
        error: err.message,
        stack: err.stack,
      });

      this.sendError(
        res,
        'Failed to retrieve active resources',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getResourcesByType = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { type } = req.params;
      logger.debug('Get resources by type request received', { type });

      if (!type) {
        this.sendBadRequest(res, 'Resource type is required');
        return;
      }

      const validTypes = ['module', 'api', 'page', 'ui', 'feature'];
      if (!validTypes.includes(type)) {
        this.sendBadRequest(res, 'Invalid resource type');
        return;
      }

      const resources = await this.resourceService.getResourcesByType(
        type as 'module' | 'api' | 'page' | 'ui' | 'feature',
      );

      logger.debug('Resources retrieved by type successfully', {
        type,
        count: resources.length,
      });

      this.sendSuccess(res, resources, 'Resources retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get resources by type:', {
        error: err.message,
        stack: err.stack,
        type: req.params.type,
      });

      this.sendError(
        res,
        'Failed to retrieve resources',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getResourcesByParentId = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { parentId } = req.params;
      logger.debug('Get resources by parent ID request received', { parentId });

      if (!parentId) {
        this.sendBadRequest(res, 'Parent ID is required');
        return;
      }

      const resources =
        await this.resourceService.getResourcesByParentId(parentId);

      logger.debug('Resources retrieved by parent ID successfully', {
        parentId,
        count: resources.length,
      });

      this.sendSuccess(res, resources, 'Resources retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get resources by parent ID:', {
        error: err.message,
        stack: err.stack,
        parentId: req.params.parentId,
      });

      this.sendError(
        res,
        'Failed to retrieve resources',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public updateResource = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body as UpdatePermissionResourceDto;
      logger.debug('Update resource request received', { id, updateData });

      if (!id) {
        this.sendBadRequest(res, 'Resource ID is required');
        return;
      }

      const resource = await this.resourceService.updateResource(
        id,
        updateData,
      );

      if (!resource) {
        this.sendNotFound(res, 'Resource not found');
        return;
      }

      logger.info('Resource updated successfully', {
        id,
        identifier: resource.identifier,
      });

      this.sendSuccess(res, resource, 'Resource updated successfully');
    } catch (error) {
      this.handleUpdateResourceError(error, req, res);
    }
  };

  private handleUpdateResourceError(
    error: unknown,
    req: Request,
    res: Response,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    const updateData = req.body as UpdatePermissionResourceDto;
    logger.error('Failed to update resource:', {
      error: err.message,
      stack: err.stack,
      id: req.params.id,
      updateData,
    });

    if (error instanceof DatabaseValidationException) {
      this.sendBadRequest(res, err.message);
      return;
    }

    this.sendError(
      res,
      'Failed to update resource',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }

  public deleteResource = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Delete resource request received', { id });

      if (!id) {
        this.sendBadRequest(res, 'Resource ID is required');
        return;
      }

      const deleted = await this.resourceService.deleteResource(id);

      if (!deleted) {
        this.sendNotFound(res, 'Resource not found');
        return;
      }

      logger.info('Resource deleted successfully', { id });

      this.sendSuccess(res, { deleted: true }, 'Resource deleted successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete resource:', {
        error: err.message,
        stack: err.stack,
        id: req.params.id,
      });

      this.sendError(
        res,
        'Failed to delete resource',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };
}
