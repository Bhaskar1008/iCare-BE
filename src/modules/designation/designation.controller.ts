import type { Request, Response } from 'express';
import { BaseController } from '@/controllers/base.controller';
import { DesignationService } from '@/modules/designation/designation.service';
import type { CreateDesignationDto } from '@/modules/designation/dto/create-designation.dto';
import type { DesignationQueryDto } from '@/modules/designation/dto/designation-query.dto';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';
import {
  HTTP_STATUS,
  PAGINATION,
} from '@/common/constants/http-status.constants';
import logger from '@/common/utils/logger';
import type {
  IDesignationController,
  IDesignationService,
} from '@/modules/designation/interfaces/designation.interface';
import type { ValidatedRequest } from '@/common/interfaces/validation.interface';

export class DesignationController
  extends BaseController
  implements IDesignationController
{
  private designationService: IDesignationService;

  constructor() {
    super();
    this.designationService = new DesignationService();
  }

  public createDesignation = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Create designation request received', req.body);

      // req.body is now validated and transformed by ValidationPipe
      const designationData = req.body as CreateDesignationDto;
      const designation =
        await this.designationService.createDesignation(designationData);

      logger.info('Designation created successfully', {
        id: designation._id,
        code: designation.designationCode,
      });

      this.sendCreated(res, designation, 'Designation created successfully');
    } catch (error) {
      this.handleCreateDesignationError(error, req, res);
    }
  };

  private handleCreateDesignationError(
    error: unknown,
    req: Request,
    res: Response,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to create designation:', {
      error: err.message,
      stack: err.stack,
    });

    if (error instanceof DatabaseValidationException) {
      this.sendBadRequest(res, err.message);
      return;
    }

    this.sendError(
      res,
      'Failed to create designation',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }

  public getDesignationById = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Get designation by ID request received', { id });

      if (!id) {
        this.sendBadRequest(res, 'Designation ID is required');
        return;
      }

      const designation = await this.designationService.getDesignationById(
        id,
        true,
      );

      if (!designation) {
        this.sendNotFound(res, 'Designation not found');
        return;
      }

      logger.debug('Designation retrieved successfully', {
        id,
        code: designation.designationCode,
      });
      this.sendSuccess(res, designation, 'Designation retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get designation by ID:', {
        error: err.message,
        stack: err.stack,
        id: req.params.id,
      });

      this.sendError(
        res,
        'Failed to retrieve designation',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  private validateCodeAndChannelId(
    code: string | undefined,
    channelId: unknown,
    res: Response,
  ): boolean {
    if (!code) {
      this.sendBadRequest(res, 'Designation code is required');
      return false;
    }

    if (!channelId || typeof channelId !== 'string') {
      this.sendBadRequest(res, 'Channel ID is required');
      return false;
    }

    return true;
  }

  public getDesignationByCode = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { code } = req.params;
      const { channelId } = req.query;
      logger.debug('Get designation by code request received', {
        code,
        channelId,
      });

      if (!this.validateCodeAndChannelId(code, channelId, res)) {
        return;
      }

      const designation = await this.designationService.getDesignationByCode(
        code,
        channelId as string,
        true,
      );

      if (!designation) {
        this.sendNotFound(res, 'Designation not found');
        return;
      }

      logger.debug('Designation retrieved successfully', {
        code,
        channelId,
        id: designation._id,
      });
      this.sendSuccess(res, designation, 'Designation retrieved successfully');
    } catch (error) {
      this.handleDesignationError(
        error,
        'Failed to retrieve designation',
        req.params.code,
        req.query.channelId,
        res,
      );
    }
  };

  private handleDesignationError(
    error: unknown,
    message: string,
    code?: string,
    channelId?: unknown,
    res?: Response,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(`${message}:`, {
      error: err.message,
      stack: err.stack,
      code,
      channelId,
    });

    if (res) {
      this.sendError(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR, err);
    }
  }

  private parseQueryParams(req: Request): {
    page: number;
    limit: number;
    status?: 'active' | 'inactive';
    channelId?: string;
    roleId?: string;
    hierarchyId?: string;
  } {
    const queryParams = (req as ValidatedRequest<DesignationQueryDto>)
      .validatedQuery;
    const page = queryParams.page
      ? parseInt(queryParams.page, 10)
      : PAGINATION.DEFAULT_PAGE;
    const limit = queryParams.limit
      ? parseInt(queryParams.limit, 10)
      : PAGINATION.DEFAULT_LIMIT;

    return {
      page,
      limit,
      status: queryParams.status,
      channelId: queryParams.channelId,
      roleId: queryParams.roleId,
      hierarchyId: queryParams.hierarchyId,
    };
  }

  public getAllDesignations = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Get all designations request received', {
        query: req.query,
      });

      const params = this.parseQueryParams(req);

      const result = await this.designationService.getAllDesignations(
        params.page,
        params.limit,
        params.status,
        params.channelId,
        params.roleId,
        params.hierarchyId,
        true,
      );

      logger.debug('Designations retrieved successfully', {
        count: result.designations.length,
        total: result.pagination.total,
        page: params.page,
        limit: params.limit,
      });

      this.sendSuccess(res, result, 'Designations retrieved successfully');
    } catch (error) {
      this.handleDesignationError(
        error,
        'Failed to retrieve designations',
        undefined,
        undefined,
        res,
      );
    }
  };

  public getActiveDesignations = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Get active designations request received');

      const designations =
        await this.designationService.getActiveDesignations(true);

      logger.debug('Active designations retrieved successfully', {
        count: designations.length,
      });
      this.sendSuccess(
        res,
        designations,
        'Active designations retrieved successfully',
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get active designations:', {
        error: err.message,
        stack: err.stack,
      });

      this.sendError(
        res,
        'Failed to retrieve active designations',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getDesignationsByChannelId = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { channelId } = req.params;
      logger.debug('Get designations by channel ID request received', {
        channelId,
      });

      if (!channelId) {
        this.sendBadRequest(res, 'Channel ID is required');
        return;
      }

      const designations =
        await this.designationService.getDesignationsByChannelId(
          channelId,
          true,
        );

      logger.debug('Designations retrieved by channel ID successfully', {
        channelId,
        count: designations.length,
      });
      this.sendSuccess(
        res,
        designations,
        'Designations retrieved by channel ID successfully',
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get designations by channel ID:', {
        error: err.message,
        stack: err.stack,
        channelId: req.params.channelId,
      });

      this.sendError(
        res,
        'Failed to retrieve designations by channel ID',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getDesignationsByHierarchyId = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { hierarchyId } = req.params;
      logger.debug('Get designations by hierarchy ID request received', {
        hierarchyId,
      });

      if (!hierarchyId) {
        this.sendBadRequest(res, 'Hierarchy ID is required');
        return;
      }

      const designations =
        await this.designationService.getDesignationsByHierarchyId(
          hierarchyId,
          true,
        );

      logger.debug('Designations retrieved by hierarchy ID successfully', {
        hierarchyId,
        count: designations.length,
      });
      this.sendSuccess(
        res,
        designations,
        'Designations retrieved by hierarchy ID successfully',
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get designations by hierarchy ID:', {
        error: err.message,
        stack: err.stack,
        hierarchyId: req.params.hierarchyId,
      });

      this.sendError(
        res,
        'Failed to retrieve designations by hierarchy ID',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getDesignationsByRoleId = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { roleId } = req.params;
      logger.debug('Get designations by role ID request received', { roleId });

      if (!roleId) {
        this.sendBadRequest(res, 'Role ID is required');
        return;
      }

      const designations =
        await this.designationService.getDesignationsByRoleId(roleId, true);

      logger.debug('Designations retrieved by role ID successfully', {
        roleId,
        count: designations.length,
      });
      this.sendSuccess(
        res,
        designations,
        'Designations retrieved by role ID successfully',
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get designations by role ID:', {
        error: err.message,
        stack: err.stack,
        roleId: req.params.roleId,
      });

      this.sendError(
        res,
        'Failed to retrieve designations by role ID',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };
}
