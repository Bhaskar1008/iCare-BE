import type { Request, Response } from 'express';
import type { CreateChannelDto } from '../dto/create-channel.dto';
import type { ChannelResponseDto } from '../dto/channel-response.dto';
import type { IChannel } from '@/models/channel.model';
import type { FilterQuery } from 'mongoose';

export interface IChannelRepository {
  create(data: Partial<IChannel>): Promise<IChannel>;
  findById(id: string): Promise<IChannel | null>;
  findByCode(code: string): Promise<IChannel | null>;
  findActiveChannels(): Promise<IChannel[]>;
  findByProjectId(projectId: string): Promise<IChannel[]>;
  findWithPagination(
    filter?: FilterQuery<IChannel>,
    page?: number,
    limit?: number,
  ): Promise<{ channels: IChannel[]; total: number; totalPages: number }>;
}

export interface IChannelService {
  createChannel(data: CreateChannelDto): Promise<ChannelResponseDto>;
  getChannelById(id: string): Promise<ChannelResponseDto | null>;
  getChannelByCode(code: string): Promise<ChannelResponseDto | null>;
  getChannelsByProjectId(projectId: string): Promise<ChannelResponseDto[]>;
  getAllChannels(
    page?: number,
    limit?: number,
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
  }>;
  getActiveChannels(): Promise<ChannelResponseDto[]>;
}

export interface IChannelController {
  createChannel(req: Request, res: Response): Promise<void>;
  getChannelById(req: Request, res: Response): Promise<void>;
  getChannelByCode(req: Request, res: Response): Promise<void>;
  getAllChannels(req: Request, res: Response): Promise<void>;
  getActiveChannels(req: Request, res: Response): Promise<void>;
  getChannelsByProjectId(
    req: Request<{ projectId: string }>,
    res: Response,
  ): Promise<void>;
}
