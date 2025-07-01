import type { Request, Response } from 'express';
import { BaseController } from '@/controllers/base.controller';
import { ResourceCenterMasterService } from './resource-center-master.service';
import type { IResourceCenterMasterController } from './interfaces/resource-center-master.interface';
import { CreateResourceCenterMasterDto } from './dto/create-resource-center-master.dto';
import { UpdateResourceCenterMasterDto } from './dto/update-resource-center-master.dto';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import logger from '@/common/utils/logger';

interface ErrorWithMessage {
  message: string;
}

function normalizeError(error: unknown): ErrorWithMessage {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return { message: error };
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return error as ErrorWithMessage;
  }
  return { message: 'Unknown error' };
}

export class ResourceCenterMasterController
  extends BaseController
  implements IResourceCenterMasterController
{
  private resourceCenterMasterService: ResourceCenterMasterService;

  constructor() {
    super();
    this.resourceCenterMasterService = new ResourceCenterMasterService();
  }

  async createResourceCenterMaster(
    req: Request<unknown, unknown, Partial<CreateResourceCenterMasterDto>>,
    res: Response,
  ): Promise<void> {
    try {
      logger.debug('Creating resource center master', {
        resourceCategoryName: req.body.resourceCategoryName,
      });

      const createDto = new CreateResourceCenterMasterDto(req.body);
      const resourceCenterMaster =
        await this.resourceCenterMasterService.createResourceCenterMaster(
          createDto,
        );

      this.sendCreated(
        res,
        resourceCenterMaster,
        'Resource center master created successfully',
      );
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to create resource center master:', {
        error: err.message,
        body: req.body,
      });

      // Handle duplicate category ID error
      if (err?.message?.includes('already exists')) {
        this.sendError(res, err.message, HTTP_STATUS.CONFLICT, err);
        return;
      }

      this.sendError(
        res,
        'Failed to create resource center master.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async getAllResourceCenterMasters(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      logger.debug('Fetching all resource center masters');

      const resourceCenterMasters =
        await this.resourceCenterMasterService.getAllResourceCenterMasters();
      this.sendSuccess(
        res,
        resourceCenterMasters,
        'Successfully fetched all resource center masters.',
      );
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to fetch resource center masters:', {
        error: err.message,
      });
      this.sendError(
        res,
        'Failed to fetch resource center masters.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  async updateResourceCenterMaster(
    req: Request<
      { id: string },
      unknown,
      Partial<UpdateResourceCenterMasterDto>
    >,
    res: Response,
  ): Promise<void> {
    try {
      const { id } = req.params;
      logger.debug('Updating resource center master', { id });

      const updateDto = new UpdateResourceCenterMasterDto(req.body);
      const resourceCenterMaster =
        await this.resourceCenterMasterService.updateResourceCenterMaster(
          id,
          updateDto,
        );

      if (!resourceCenterMaster) {
        this.sendNotFound(res, 'Resource center master not found');
        return;
      }

      this.sendUpdated(
        res,
        resourceCenterMaster,
        'Resource center master updated successfully',
      );
    } catch (error) {
      this.handleUpdateError(error, req, res);
    }
  }

  private handleUpdateError(
    error: unknown,
    req: Request<
      { id: string },
      unknown,
      Partial<UpdateResourceCenterMasterDto>
    >,
    res: Response,
  ): void {
    const err = normalizeError(error);
    logger.error('Failed to update resource center master:', {
      error: err.message,
      id: req.params.id,
      body: req.body,
    });

    // Handle duplicate category ID error
    if (err?.message?.includes('already exists')) {
      this.sendError(res, err.message, HTTP_STATUS.CONFLICT, err);
      return;
    }

    this.sendError(
      res,
      'Failed to update resource center master.',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }
}
