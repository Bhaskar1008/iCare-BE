import { ChannelRepository } from '@/modules/channel/channel.repository';
import type { CreateChannelDto } from '@/modules/channel/dto/create-channel.dto';
import type { ChannelResponseDto } from '@/modules/channel/dto/channel-response.dto';
import type { IChannel } from '@/models/channel.model';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';
import logger from '@/common/utils/logger';
import type {
  IChannelService,
  IChannelRepository,
} from '@/modules/channel/interfaces/channel.interface';
import { Types } from 'mongoose';

export class ChannelService implements IChannelService {
  private channelRepository: IChannelRepository;

  constructor() {
    this.channelRepository = new ChannelRepository();
  }

  public async createChannel(
    data: CreateChannelDto,
  ): Promise<ChannelResponseDto> {
    try {
      logger.debug('Creating channel', { data });

      const existingChannel = await this.channelRepository.findByCode(
        data.channelCode,
      );
      if (existingChannel) {
        throw new DatabaseValidationException(
          `Channel with code '${data.channelCode}' already exists`,
        );
      }

      const channelData = {
        channelName: data.channelName,
        channelCode: data.channelCode,
        channelStatus: data.channelStatus ?? 'active',
        projectId: data.projectId
          ? new Types.ObjectId(data.projectId)
          : undefined,
      };

      const channel = await this.channelRepository.create(channelData);
      logger.info('Channel created successfully', {
        id: channel._id,
        code: channel.channelCode,
      });

      return this.mapToResponseDto(channel);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create channel:', {
        error: err.message,
        stack: err.stack,
        data,
      });
      throw error;
    }
  }

  public async getChannelById(id: string): Promise<ChannelResponseDto | null> {
    try {
      logger.debug('Getting channel by ID', { id });
      const channel = await this.channelRepository.findById(id);

      if (!channel || channel.isDeleted) {
        logger.debug('Channel not found or deleted', { id });
        return null;
      }

      logger.debug('Channel found by ID', { id, code: channel.channelCode });
      return this.mapToResponseDto(channel);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get channel by ID:', {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }

  public async getChannelByCode(
    code: string,
  ): Promise<ChannelResponseDto | null> {
    try {
      logger.debug('Getting channel by code', { code });
      const channel = await this.channelRepository.findByCode(code);

      if (!channel) {
        logger.debug('Channel not found by code', { code });
        return null;
      }

      logger.debug('Channel found by code', { code, id: channel._id });
      return this.mapToResponseDto(channel);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get channel by code:', {
        error: err.message,
        stack: err.stack,
        code,
      });
      throw error;
    }
  }

  public async getAllChannels(
    page: number = 1,
    limit: number = 10,
    status?: 'active' | 'inactive',
    projectId?: string,
  ): Promise<{
    channels: ChannelResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      logger.debug('Getting all channels', { page, limit, status, projectId });

      const result = await this.fetchChannelsWithPagination(
        page,
        limit,
        status,
        projectId,
      );

      this.logChannelsRetrieved(result, page, limit);

      return this.formatChannelsResponse(result, page, limit);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get all channels:', {
        error: err.message,
        stack: err.stack,
        page,
        limit,
        status,
        projectId,
      });
      throw error;
    }
  }

  private async fetchChannelsWithPagination(
    page: number,
    limit: number,
    status?: 'active' | 'inactive',
    projectId?: string,
  ): Promise<{
    channels: IChannel[];
    total: number;
    totalPages: number;
  }> {
    const filter: Record<string, unknown> = {};

    if (status) {
      filter.channelStatus = status;
    }

    if (projectId) {
      filter.projectId = new Types.ObjectId(projectId);
    }

    return this.channelRepository.findWithPagination(filter, page, limit);
  }

  private logChannelsRetrieved(
    result: { channels: IChannel[]; total: number },
    page: number,
    limit: number,
  ): void {
    logger.debug('Channels retrieved successfully', {
      count: result.channels.length,
      total: result.total,
      page,
      limit,
    });
  }

  private formatChannelsResponse(
    result: {
      channels: IChannel[];
      total: number;
      totalPages: number;
    },
    page: number,
    limit: number,
  ): {
    channels: ChannelResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } {
    return {
      channels: result.channels.map(channel => this.mapToResponseDto(channel)),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  public async getActiveChannels(): Promise<ChannelResponseDto[]> {
    try {
      logger.debug('Getting active channels');
      const channels = await this.channelRepository.findActiveChannels();

      logger.debug('Active channels retrieved successfully', {
        count: channels.length,
      });
      return channels.map(channel => this.mapToResponseDto(channel));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get active channels:', {
        error: err.message,
        stack: err.stack,
      });
      throw error;
    }
  }

  public async getChannelsByProjectId(
    projectId: string,
  ): Promise<ChannelResponseDto[]> {
    try {
      logger.debug('Getting channels by project ID', { projectId });
      const channels = await this.channelRepository.findByProjectId(projectId);

      logger.debug('Channels retrieved by project ID successfully', {
        projectId,
        count: channels.length,
      });
      return channels.map(channel => this.mapToResponseDto(channel));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get channels by project ID:', {
        error: err.message,
        stack: err.stack,
        projectId,
      });
      throw error;
    }
  }

  private mapToResponseDto(channel: IChannel): ChannelResponseDto {
    return {
      _id: channel._id,
      channelName: channel.channelName,
      channelCode: channel.channelCode,
      channelStatus: channel.channelStatus,
      projectId:
        typeof channel.projectId === 'string' ||
        channel.projectId instanceof Types.ObjectId
          ? channel.projectId.toString()
          : undefined,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
    };
  }
}
