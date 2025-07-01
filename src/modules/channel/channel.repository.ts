import { BaseRepository } from '@/repository/base.repository';
import { ChannelModel, type IChannel } from '@/models/channel.model';
import type { FilterQuery } from 'mongoose';
import logger from '@/common/utils/logger';
import type { IChannelRepository } from '@/modules/channel/interfaces/channel.interface';
import { Types } from 'mongoose';

export class ChannelRepository
  extends BaseRepository<IChannel>
  implements IChannelRepository
{
  constructor() {
    super(ChannelModel);
  }

  public async findByCode(code: string): Promise<IChannel | null> {
    try {
      logger.debug('Finding channel by code', { code });
      const result = await this.model
        .findOne({ channelCode: code, isDeleted: false })
        .exec();
      logger.debug('Channel found by code', { code, found: !!result });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find channel by code:', {
        error: err.message,
        stack: err.stack,
        code,
      });
      throw error;
    }
  }

  public async findActiveChannels(): Promise<IChannel[]> {
    try {
      logger.debug('Finding active channels');
      const result = await this.model
        .find({ channelStatus: 'active', isDeleted: false })
        .sort({ createdAt: -1 })
        .exec();
      logger.debug('Active channels found', { count: result.length });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find active channels:', {
        error: err.message,
        stack: err.stack,
      });
      throw error;
    }
  }

  public async findWithPagination(
    filter: FilterQuery<IChannel> = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<{ channels: IChannel[]; total: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const baseFilter = { ...filter, isDeleted: false };

      logger.debug('Finding channels with pagination', {
        filter: baseFilter,
        page,
        limit,
        skip,
      });

      const [channels, total] = await Promise.all([
        this.model
          .find(baseFilter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.model.countDocuments(baseFilter).exec(),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.debug('Channels found with pagination', {
        count: channels.length,
        total,
        totalPages,
        page,
        limit,
      });

      return { channels, total, totalPages };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find channels with pagination:', {
        error: err.message,
        stack: err.stack,
        filter,
        page,
        limit,
      });
      throw error;
    }
  }

  public async findByProjectId(projectId: string): Promise<IChannel[]> {
    try {
      logger.debug('Finding channels by project ID', { projectId });
      const result = await this.model
        .find({
          projectId: new Types.ObjectId(projectId),
          isDeleted: false,
        })
        .sort({ createdAt: -1 })
        .exec();
      logger.debug('Channels found by project ID', {
        projectId,
        count: result.length,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find channels by project ID:', {
        error: err.message,
        stack: err.stack,
        projectId,
      });
      throw error;
    }
  }
}
