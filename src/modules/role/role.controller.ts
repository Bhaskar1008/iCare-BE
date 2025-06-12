import type { Request, Response } from 'express';
import { BaseController } from '@/controllers/base.controller';
import { RoleService } from '@/modules/role/role.service';
import type { CreateRoleDto } from '@/modules/role/dto/create-role.dto';
import type { UpdateRoleDto } from '@/modules/role/dto/update-role.dto';
import type { RoleQueryDto } from '@/modules/role/dto/role-query.dto';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';
import {
  HTTP_STATUS,
  PAGINATION,
} from '@/common/constants/http-status.constants';
import logger from '@/common/utils/logger';
import type {
  IRoleController,
  IRoleService,
} from '@/modules/role/interfaces/role.interface';
import type { ValidatedRequest } from '@/common/interfaces/validation.interface';

export class RoleController extends BaseController implements IRoleController {
  private roleService: IRoleService;

  constructor() {
    super();
    this.roleService = new RoleService();
  }

  public createRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const roleData = req.body as CreateRoleDto;
      logger.debug('Create role request received', { roleData });

      const role = await this.roleService.createRole(roleData);

      logger.info('Role created successfully', {
        id: role._id,
        name: role.roleName,
        code: role.roleCode,
      });

      this.sendSuccess(
        res,
        role,
        'Role created successfully',
        HTTP_STATUS.CREATED,
      );
    } catch (error) {
      this.handleCreateRoleError(error, req, res);
    }
  };

  private handleCreateRoleError(
    error: unknown,
    req: Request,
    res: Response,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to create role:', {
      error: err.message,
      stack: err.stack,
    });

    if (error instanceof DatabaseValidationException) {
      this.sendBadRequest(res, err.message);
      return;
    }

    this.sendError(
      res,
      'Failed to create role',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }

  public getRoleById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Get role by ID request received', { id });

      if (!id) {
        this.sendBadRequest(res, 'Role ID is required');
        return;
      }

      const role = await this.roleService.getRoleById(id);

      if (!role) {
        this.sendNotFound(res, 'Role not found');
        return;
      }

      logger.debug('Role retrieved successfully', {
        id,
        name: role.roleName,
      });
      this.sendSuccess(res, role, 'Role retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get role by ID:', {
        error: err.message,
        stack: err.stack,
        id: req.params.id,
      });

      this.sendError(
        res,
        'Failed to retrieve role',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getRoleByCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.params;
      const { channelId } = req.query;

      logger.debug('Get role by code request received', { code, channelId });

      if (!code) {
        this.sendBadRequest(res, 'Role code is required');
        return;
      }

      const roleCode = parseInt(code, 10);
      if (isNaN(roleCode)) {
        this.sendBadRequest(res, 'Role code must be a valid number');
        return;
      }

      const role = await this.roleService.getRoleByCode(
        roleCode,
        channelId as string,
      );

      if (!role) {
        this.sendNotFound(res, 'Role not found');
        return;
      }

      logger.debug('Role retrieved successfully', {
        code: roleCode,
        id: role._id,
      });
      this.sendSuccess(res, role, 'Role retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get role by code:', {
        error: err.message,
        stack: err.stack,
        code: req.params.code,
      });

      this.sendError(
        res,
        'Failed to retrieve role',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getRolesByChannelId = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { channelId } = req.params;
      logger.debug('Get roles by channel ID request received', { channelId });

      if (!channelId) {
        this.sendBadRequest(res, 'Channel ID is required');
        return;
      }

      const roles = await this.roleService.getRolesByChannelId(channelId);

      logger.debug('Roles retrieved successfully', {
        channelId,
        count: roles.length,
      });

      this.sendSuccess(res, roles, 'Roles retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get roles by channel ID:', {
        error: err.message,
        stack: err.stack,
        channelId: req.params.channelId,
      });

      this.sendError(
        res,
        'Failed to retrieve roles',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getAllRoles = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.debug('Get all roles request received', { query: req.query });

      const queryParams = this.extractRoleQueryParams(req);
      const result = await this.roleService.getAllRoles(
        queryParams.page,
        queryParams.limit,
        queryParams.status,
        queryParams.channelId,
        queryParams.search,
        queryParams.isSystem,
      );

      this.logRolesRetrieved(result, queryParams.page, queryParams.limit);
      this.sendSuccess(res, result, 'Roles retrieved successfully');
    } catch (error) {
      this.handleGetAllRolesError(error, req, res);
    }
  };

  private extractRoleQueryParams(req: Request): {
    page: number;
    limit: number;
    status?: 'active' | 'inactive';
    channelId?: string;
    search?: string;
    isSystem?: boolean;
  } {
    const queryParams = (req as ValidatedRequest<RoleQueryDto>).validatedQuery;

    return {
      page: queryParams.page
        ? parseInt(queryParams.page, 10)
        : PAGINATION.DEFAULT_PAGE,
      limit: queryParams.limit
        ? parseInt(queryParams.limit, 10)
        : PAGINATION.DEFAULT_LIMIT,
      status: queryParams.status,
      channelId: queryParams.channelId,
      search: queryParams.search,
      isSystem: queryParams.isSystem,
    };
  }

  private logRolesRetrieved(
    result: { roles: unknown[]; pagination: { total: number } },
    page: number,
    limit: number,
  ): void {
    logger.debug('Roles retrieved successfully', {
      count: result.roles.length,
      total: result.pagination.total,
      page,
      limit,
    });
  }

  private handleGetAllRolesError(
    error: unknown,
    req: Request,
    res: Response,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get all roles:', {
      error: err.message,
      stack: err.stack,
      query: req.query,
    });

    this.sendError(
      res,
      'Failed to retrieve roles',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }

  public getActiveRoles = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { channelId } = req.query;
      logger.debug('Get active roles request received', { channelId });

      const roles = await this.roleService.getActiveRoles(channelId as string);

      logger.debug('Active roles retrieved successfully', {
        channelId,
        count: roles.length,
      });

      this.sendSuccess(res, roles, 'Active roles retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get active roles:', {
        error: err.message,
        stack: err.stack,
        channelId: req.query.channelId,
      });

      this.sendError(
        res,
        'Failed to retrieve active roles',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getSystemRoles = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Get system roles request received');

      const roles = await this.roleService.getSystemRoles();

      logger.debug('System roles retrieved successfully', {
        count: roles.length,
      });

      this.sendSuccess(res, roles, 'System roles retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get system roles:', {
        error: err.message,
        stack: err.stack,
      });

      this.sendError(
        res,
        'Failed to retrieve system roles',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public updateRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body as UpdateRoleDto;
      logger.debug('Update role request received', { id, updateData });

      if (!id) {
        this.sendBadRequest(res, 'Role ID is required');
        return;
      }

      const role = await this.roleService.updateRole(id, updateData);

      if (!role) {
        this.sendNotFound(res, 'Role not found');
        return;
      }

      logger.info('Role updated successfully', {
        id,
        name: role.roleName,
      });

      this.sendSuccess(res, role, 'Role updated successfully');
    } catch (error) {
      this.handleUpdateRoleError(error, req, res);
    }
  };

  private handleUpdateRoleError(
    error: unknown,
    req: Request,
    res: Response,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update role:', {
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
      'Failed to update role',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }

  public deleteRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Delete role request received', { id });

      if (!id) {
        this.sendBadRequest(res, 'Role ID is required');
        return;
      }

      const success = await this.roleService.deleteRole(id);

      if (!success) {
        this.sendNotFound(res, 'Role not found');
        return;
      }

      logger.info('Role deleted successfully', { id });
      this.sendSuccess(res, { id }, 'Role deleted successfully');
    } catch (error) {
      this.handleDeleteRoleError(error, req, res);
    }
  };

  private handleDeleteRoleError(
    error: unknown,
    req: Request,
    res: Response,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to delete role:', {
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
      'Failed to delete role',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }
}
