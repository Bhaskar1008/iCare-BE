import type { Request, Response } from 'express';
import { BaseController } from '@/controllers/base.controller';
import { ChannelService } from '@/modules/channel/channel.service';
import type { CreateChannelDto } from '@/modules/channel/dto/create-channel.dto';
import type { ChannelQueryDto } from '@/modules/channel/dto/channel-query.dto';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';
import {
  HTTP_STATUS,
  PAGINATION,
} from '@/common/constants/http-status.constants';
import logger from '@/common/utils/logger';
import type {
  IChannelController,
  IChannelService,
} from '@/modules/channel/interfaces/channel.interface';
import type { ValidatedRequest } from '@/common/interfaces/validation.interface';
import { Types } from 'mongoose';

export class ChannelController
  extends BaseController
  implements IChannelController
{
  private channelService: IChannelService;

  constructor() {
    super();
    this.channelService = new ChannelService();
  }

  public createChannel = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.debug('Create channel request received', req.body);

      // req.body is now validated and transformed by ValidationPipe
      const channelData = req.body as CreateChannelDto;
      const channel = await this.channelService.createChannel(channelData);

      logger.info('Channel created successfully', {
        id: channel._id,
        code: channel.channelCode,
      });

      this.sendCreated(res, channel, 'Channel created successfully');
    } catch (error) {
      this.handleCreateChannelError(error, req, res);
    }
  };

  private handleCreateChannelError(
    error: unknown,
    req: Request,
    res: Response,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to create channel:', {
      error: err.message,
      stack: err.stack,
    });

    if (error instanceof DatabaseValidationException) {
      this.sendBadRequest(res, err.message);
      return;
    }

    this.sendError(
      res,
      'Failed to create channel',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }

  public getChannelById = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Get channel by ID request received', { id });

      if (!id) {
        this.sendBadRequest(res, 'Channel ID is required');
        return;
      }

      const channel = await this.channelService.getChannelById(id);

      if (!channel) {
        this.sendNotFound(res, 'Channel not found');
        return;
      }

      logger.debug('Channel retrieved successfully', {
        id,
        code: channel.channelCode,
      });
      this.sendSuccess(res, channel, 'Channel retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get channel by ID:', {
        error: err.message,
        stack: err.stack,
        id: req.params.id,
      });

      this.sendError(
        res,
        'Failed to retrieve channel',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getChannelByCode = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { code } = req.params;
      logger.debug('Get channel by code request received', { code });

      if (!code) {
        this.sendBadRequest(res, 'Channel code is required');
        return;
      }

      const channel = await this.channelService.getChannelByCode(code);

      if (!channel) {
        this.sendNotFound(res, 'Channel not found');
        return;
      }

      logger.debug('Channel retrieved successfully', { code, id: channel._id });
      this.sendSuccess(res, channel, 'Channel retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get channel by code:', {
        error: err.message,
        stack: err.stack,
        code: req.params.code,
      });

      this.sendError(
        res,
        'Failed to retrieve channel',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getAllChannels = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Get all channels request received', { query: req.query });

      const queryParams = (req as ValidatedRequest<ChannelQueryDto>)
        .validatedQuery;
      const page = queryParams.page
        ? parseInt(queryParams.page, 10)
        : PAGINATION.DEFAULT_PAGE;
      const limit = queryParams.limit
        ? parseInt(queryParams.limit, 10)
        : PAGINATION.DEFAULT_LIMIT;
      const status = queryParams.status;
      const projectId = queryParams.projectId;

      const result = await this.channelService.getAllChannels(
        page,
        limit,
        status,
        projectId,
      );

      logger.debug('Channels retrieved successfully', {
        count: result.channels.length,
        total: result.pagination.total,
        page,
        limit,
      });

      this.sendSuccess(res, result, 'Channels retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get all channels:', {
        error: err.message,
        stack: err.stack,
        query: req.query,
      });

      this.sendError(
        res,
        'Failed to retrieve channels',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getActiveChannels = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Get active channels request received');

      const channels = await this.channelService.getActiveChannels();

      logger.debug('Active channels retrieved successfully', {
        count: channels.length,
      });
      this.sendSuccess(res, channels, 'Active channels retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get active channels:', {
        error: err.message,
        stack: err.stack,
      });

      this.sendError(
        res,
        'Failed to retrieve active channels',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getChannelsByProjectId = async (
    req: Request<{ projectId: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const { projectId } = req.params;
      logger.debug('Get channels by project ID request received', {
        projectId,
      });

      if (!Types.ObjectId.isValid(projectId)) {
        this.sendBadRequest(res, 'Invalid project ID format');
        return;
      }

      const channels =
        await this.channelService.getChannelsByProjectId(projectId);

      logger.debug('Channels retrieved successfully', {
        projectId,
        count: channels.length,
      });
      this.sendSuccess(res, channels, 'Channels retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get channels by project ID:', {
        error: err.message,
        stack: err.stack,
        projectId: req.params.projectId,
      });

      this.sendError(
        res,
        'Failed to retrieve channels',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };
}
