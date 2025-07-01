import type { Request, Response } from 'express';
import { BaseController } from '@/controllers/base.controller';
import { ModuleConfigService } from './module-config.service';
import type { CreateModuleConfigDto } from './dto/create-module-config.dto';
import type { UpdateModuleConfigDto } from './dto/update-module-config.dto';
import type { ModuleConfigQueryDto } from './dto/module-config-query.dto';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import logger from '@/common/utils/logger';
import type {
  IModuleConfigController,
  IModuleConfigService,
} from './interfaces/module-config.interface';
import type { ValidatedRequest } from '@/common/interfaces/validation.interface';

export class ModuleConfigController
  extends BaseController
  implements IModuleConfigController
{
  private moduleConfigService: IModuleConfigService;

  constructor() {
    super();
    this.moduleConfigService = new ModuleConfigService();
  }

  public createModuleConfig = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Create module config request received', req.body);

      const configData = req.body as CreateModuleConfigDto;
      const config =
        await this.moduleConfigService.createModuleConfig(configData);

      logger.info('Module config created successfully', {
        id: config._id,
        moduleId: config.moduleId,
        projectId: config.projectId,
        configName: config.configName,
      });

      this.sendCreated(
        res,
        config,
        'Module configuration created successfully',
      );
    } catch (error) {
      this.handleCreateConfigError(error, req, res);
    }
  };

  private handleCreateConfigError(
    error: unknown,
    req: Request,
    res: Response,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to create module config:', {
      error: err.message,
      stack: err.stack,
    });

    if (error instanceof DatabaseValidationException) {
      this.sendBadRequest(res, err.message);
      return;
    }

    this.sendError(
      res,
      'Failed to create module configuration',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }

  public getModuleConfigById = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Get module config by ID request received', { id });

      if (!id) {
        this.sendBadRequest(res, 'Module config ID is required');
        return;
      }

      const config = await this.moduleConfigService.getModuleConfigById(id);

      if (!config) {
        this.sendNotFound(res, 'Module configuration not found');
        return;
      }

      logger.debug('Module config retrieved successfully', {
        id,
        configName: config.configName,
      });
      this.sendSuccess(
        res,
        config,
        'Module configuration retrieved successfully',
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get module config by ID:', {
        error: err.message,
        stack: err.stack,
        id: req.params.id,
      });

      this.sendError(
        res,
        'Failed to retrieve module configuration',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getModuleConfigsByModuleId = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { moduleId } = req.params;
      logger.debug('Get module configs by module ID request received', {
        moduleId,
      });

      if (!moduleId) {
        this.sendBadRequest(res, 'Module ID is required');
        return;
      }

      const configs =
        await this.moduleConfigService.getModuleConfigsByModuleId(moduleId);

      logger.debug('Module configs retrieved successfully', {
        moduleId,
        count: configs.length,
      });
      this.sendSuccess(
        res,
        configs,
        'Module configurations retrieved successfully',
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get module configs by module ID:', {
        error: err.message,
        stack: err.stack,
        moduleId: req.params.moduleId,
      });

      this.sendError(
        res,
        'Failed to retrieve module configurations',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getModuleConfigsByProjectId = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { projectId } = req.params;
      logger.debug('Get module configs by project ID request received', {
        projectId,
      });

      if (!projectId) {
        this.sendBadRequest(res, 'Project ID is required');
        return;
      }

      const configs =
        await this.moduleConfigService.getModuleConfigsByProjectId(projectId);

      logger.debug('Module configs retrieved successfully', {
        projectId,
        count: configs.length,
      });
      this.sendSuccess(
        res,
        configs,
        'Module configurations retrieved successfully',
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get module configs by project ID:', {
        error: err.message,
        stack: err.stack,
        projectId: req.params.projectId,
      });

      this.sendError(
        res,
        'Failed to retrieve module configurations',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getModuleConfigsByModuleIdAndProjectId = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { moduleId } = req.params;
      const { projectId } = req.query;
      logger.debug(
        'Get module configs by module ID and project ID request received',
        {
          moduleId,
          projectId,
        },
      );

      if (!moduleId) {
        this.sendBadRequest(res, 'Module ID is required');
        return;
      }

      const configs =
        await this.moduleConfigService.getModuleConfigsByModuleIdAndProjectId(
          moduleId,
          projectId as string | undefined,
        );

      logger.debug('Module configs retrieved successfully', {
        moduleId,
        projectId,
        count: configs.length,
      });
      this.sendSuccess(
        res,
        configs,
        'Module configurations retrieved successfully',
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(
        'Failed to get module configs by module ID and project ID:',
        {
          error: err.message,
          stack: err.stack,
          moduleId: req.params.moduleId,
          projectId: req.query.projectId,
        },
      );

      this.sendError(
        res,
        'Failed to retrieve module configurations',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getModuleConfigByModuleIdAndName = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { moduleId, configName } = req.params;
      const { projectId } = req.query;
      logger.debug('Get module config by module ID and name request received', {
        moduleId,
        configName,
        projectId,
      });

      if (!moduleId || !configName) {
        this.sendBadRequest(res, 'Module ID and config name are required');
        return;
      }

      const config =
        await this.moduleConfigService.getModuleConfigByModuleIdAndName(
          moduleId,
          configName,
          projectId as string | undefined,
        );

      if (!config) {
        this.sendNotFound(res, 'Module configuration not found');
        return;
      }

      logger.debug('Module config retrieved successfully', {
        moduleId,
        configName,
        projectId,
        id: config._id,
      });
      this.sendSuccess(
        res,
        config,
        'Module configuration retrieved successfully',
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get module config by module ID and name:', {
        error: err.message,
        stack: err.stack,
        moduleId: req.params.moduleId,
        configName: req.params.configName,
        projectId: req.query.projectId,
      });

      this.sendError(
        res,
        'Failed to retrieve module configuration',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getAllModuleConfigs = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Get all module configs request received', {
        query: req.query,
      });

      const queryParams = (req as ValidatedRequest<ModuleConfigQueryDto>)
        .validatedQuery;
      const filter: Record<string, unknown> = {};

      if (queryParams.moduleId) {
        filter.moduleId = queryParams.moduleId;
      }

      if (queryParams.projectId) {
        filter.projectId = queryParams.projectId;
      }

      if (queryParams.configName) {
        filter.configName = { $regex: queryParams.configName, $options: 'i' };
      }

      const configs =
        await this.moduleConfigService.getAllModuleConfigs(filter);

      logger.debug('All module configs retrieved successfully', {
        count: configs.length,
      });
      this.sendSuccess(
        res,
        configs,
        'Module configurations retrieved successfully',
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get all module configs:', {
        error: err.message,
        stack: err.stack,
        query: req.query,
      });

      this.sendError(
        res,
        'Failed to retrieve module configurations',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public updateModuleConfig = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Update module config request received', {
        id,
        body: req.body,
      });

      if (!id) {
        this.sendBadRequest(res, 'Module config ID is required');
        return;
      }

      const updateData = req.body as UpdateModuleConfigDto;
      const config = await this.moduleConfigService.updateModuleConfig(
        id,
        updateData,
      );

      if (!config) {
        this.sendNotFound(res, 'Module configuration not found');
        return;
      }

      logger.info('Module config updated successfully', {
        id,
        configName: config.configName,
      });
      this.sendSuccess(
        res,
        config,
        'Module configuration updated successfully',
      );
    } catch (error) {
      this.handleUpdateConfigError(error, req, res);
    }
  };

  private handleUpdateConfigError(
    error: unknown,
    req: Request,
    res: Response,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update module config:', {
      error: err.message,
      stack: err.stack,
      id: req.params.id,
      body: req.body,
    });

    if (error instanceof DatabaseValidationException) {
      this.sendBadRequest(res, err.message);
      return;
    }

    this.sendError(
      res,
      'Failed to update module configuration',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }

  public deleteModuleConfig = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Delete module config request received', { id });

      if (!id) {
        this.sendBadRequest(res, 'Module config ID is required');
        return;
      }

      const deleted = await this.moduleConfigService.deleteModuleConfig(id);

      if (!deleted) {
        this.sendNotFound(res, 'Module configuration not found');
        return;
      }

      logger.info('Module config deleted successfully', { id });
      this.sendSuccess(
        res,
        { deleted: true },
        'Module configuration deleted successfully',
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete module config:', {
        error: err.message,
        stack: err.stack,
        id: req.params.id,
      });

      this.sendError(
        res,
        'Failed to delete module configuration',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };
}
