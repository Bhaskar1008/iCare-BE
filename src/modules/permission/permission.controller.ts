import type { Request, Response } from 'express';
import { BaseController } from '@/controllers/base.controller';
import { PermissionService } from '@/modules/permission/permission.service';
import type { CreatePermissionDto } from '@/modules/permission/dto/create-permission.dto';
import type { UpdatePermissionDto } from '@/modules/permission/dto/update-permission.dto';
import type { PermissionQueryDto } from '@/modules/permission/dto/permission-query.dto';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';
import {
  HTTP_STATUS,
  PAGINATION,
} from '@/common/constants/http-status.constants';
import logger from '@/common/utils/logger';
import type {
  IPermissionController,
  IPermissionService,
} from '@/modules/permission/interfaces/permission.interface';
import type { ValidatedRequest } from '@/common/interfaces/validation.interface';

export class PermissionController
  extends BaseController
  implements IPermissionController
{
  private permissionService: IPermissionService;

  constructor() {
    super();
    this.permissionService = new PermissionService();
  }

  public createPermission = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Create permission request received', req.body);

      // req.body is now validated and transformed by ValidationPipe
      const permissionData = req.body as CreatePermissionDto;
      const permission =
        await this.permissionService.createPermission(permissionData);

      logger.info('Permission created successfully', {
        id: permission._id,
        resourceId: permission.resourceId,
        action: permission.action,
      });

      this.sendCreated(res, permission, 'Permission created successfully');
    } catch (error) {
      this.handleCreatePermissionError(error, req, res);
    }
  };

  private handleCreatePermissionError(
    error: unknown,
    req: Request,
    res: Response,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to create permission:', {
      error: err.message,
      stack: err.stack,
    });

    if (error instanceof DatabaseValidationException) {
      this.sendBadRequest(res, err.message);
      return;
    }

    this.sendError(
      res,
      'Failed to create permission',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }

  public getPermissionById = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Get permission by ID request received', { id });

      if (!id) {
        this.sendBadRequest(res, 'Permission ID is required');
        return;
      }

      const permission = await this.permissionService.getPermissionById(id);

      if (!permission) {
        this.sendNotFound(res, 'Permission not found');
        return;
      }

      logger.debug('Permission retrieved successfully', {
        id,
        resourceId: permission.resourceId,
        action: permission.action,
      });
      this.sendSuccess(res, permission, 'Permission retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get permission by ID:', {
        error: err.message,
        stack: err.stack,
        id: req.params.id,
      });

      this.sendError(
        res,
        'Failed to retrieve permission',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getPermissionsByResourceId = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { resourceId } = req.params;
      logger.debug('Get permissions by resource ID request received', {
        resourceId,
      });

      if (!resourceId) {
        this.sendBadRequest(res, 'Resource ID is required');
        return;
      }

      const permissions =
        await this.permissionService.getPermissionsByResourceId(resourceId);

      logger.debug('Permissions retrieved successfully', {
        resourceId,
        count: permissions.length,
      });
      this.sendSuccess(res, permissions, 'Permissions retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get permissions by resource ID:', {
        error: err.message,
        stack: err.stack,
        resourceId: req.params.resourceId,
      });

      this.sendError(
        res,
        'Failed to retrieve permissions',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getAllPermissions = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Get all permissions request received', {
        query: req.query,
      });

      const queryParams = this.extractQueryParams(req);
      const result = await this.permissionService.getAllPermissions(
        queryParams.page,
        queryParams.limit,
        queryParams.status,
        queryParams.effect,
        queryParams.resourceId,
        queryParams.action,
      );

      this.logPermissionsRetrieved(result, queryParams.page, queryParams.limit);
      this.sendSuccess(res, result, 'Permissions retrieved successfully');
    } catch (error) {
      this.handleGetAllPermissionsError(error, req, res);
    }
  };

  private extractQueryParams(req: Request): {
    page: number;
    limit: number;
    status?: 'active' | 'inactive';
    effect?: 'allow' | 'deny';
    resourceId?: string;
    action?: string;
  } {
    const validatedRequest = req as ValidatedRequest<PermissionQueryDto>;
    const queryParams = validatedRequest.validatedQuery;

    return {
      page: queryParams.page
        ? parseInt(queryParams.page, 10)
        : PAGINATION.DEFAULT_PAGE,
      limit: queryParams.limit
        ? parseInt(queryParams.limit, 10)
        : PAGINATION.DEFAULT_LIMIT,
      status: queryParams.status,
      effect: queryParams.effect,
      resourceId: queryParams.resourceId,
      action: queryParams.action,
    };
  }

  private logPermissionsRetrieved(
    result: { permissions: unknown[]; pagination: { total: number } },
    page: number,
    limit: number,
  ): void {
    logger.debug('Permissions retrieved successfully', {
      count: result.permissions.length,
      total: result.pagination.total,
      page,
      limit,
    });
  }

  private handleGetAllPermissionsError(
    error: unknown,
    req: Request,
    res: Response,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get all permissions:', {
      error: err.message,
      stack: err.stack,
      query: req.query,
    });

    this.sendError(
      res,
      'Failed to retrieve permissions',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }

  public getActivePermissions = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Get active permissions request received');

      const permissions = await this.permissionService.getActivePermissions();

      logger.debug('Active permissions retrieved successfully', {
        count: permissions.length,
      });
      this.sendSuccess(
        res,
        permissions,
        'Active permissions retrieved successfully',
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get active permissions:', {
        error: err.message,
        stack: err.stack,
      });

      this.sendError(
        res,
        'Failed to retrieve active permissions',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public updatePermission = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Update permission request received', {
        id,
        body: req.body as UpdatePermissionDto,
      });

      if (!id) {
        this.sendBadRequest(res, 'Permission ID is required');
        return;
      }

      const updateData = req.body as UpdatePermissionDto;
      const permission = await this.permissionService.updatePermission(
        id,
        updateData,
      );

      if (!permission) {
        this.sendNotFound(res, 'Permission not found');
        return;
      }

      logger.info('Permission updated successfully', {
        id: permission._id,
        resourceId: permission.resourceId,
        action: permission.action,
      });

      this.sendSuccess(res, permission, 'Permission updated successfully');
    } catch (error) {
      this.handleUpdatePermissionError(error, req, res);
    }
  };

  private handleUpdatePermissionError(
    error: unknown,
    req: Request,
    res: Response,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update permission:', {
      error: err.message,
      stack: err.stack,
      id: req.params.id,
    });

    if (error instanceof DatabaseValidationException) {
      this.sendBadRequest(res, err.message);
      return;
    }

    this.sendError(
      res,
      'Failed to update permission',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }

  public deletePermission = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Delete permission request received', { id });

      if (!id) {
        this.sendBadRequest(res, 'Permission ID is required');
        return;
      }

      const deleted = await this.permissionService.deletePermission(id);

      if (!deleted) {
        this.sendNotFound(res, 'Permission not found');
        return;
      }

      logger.info('Permission deleted successfully', { id });
      this.sendSuccess(
        res,
        { deleted: true },
        'Permission deleted successfully',
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete permission:', {
        error: err.message,
        stack: err.stack,
        id: req.params.id,
      });

      this.sendError(
        res,
        'Failed to delete permission',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };
}
