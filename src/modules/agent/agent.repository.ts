import { BaseRepository } from '@/repository/base.repository';
import { AgentModel, type IAgent } from '@/models/agent.model';
import type { FilterQuery } from 'mongoose';
import logger from '@/common/utils/logger';
import type { IAgentRepository } from '@/modules/agent/interfaces/agent.interface';
import { Types } from 'mongoose';

export class AgentRepository
  extends BaseRepository<IAgent>
  implements IAgentRepository
{
  constructor() {
    super(AgentModel);
  }

  public async findByCode(code: string): Promise<IAgent | null> {
    try {
      logger.debug('Finding agent by code', { code });
      const result = await this.model
        .findOne({ agentCode: code, isDeleted: false })
        .populate('channelId')
        .populate('designationId')
        .populate('teamLeadId')
        .populate('reportingManagerId')
        .exec();
      logger.debug('Agent found by code', { code, found: !!result });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find agent by code:', {
        error: err.message,
        stack: err.stack,
        code,
      });
      throw error;
    }
  }

  public async findActiveAgents(): Promise<IAgent[]> {
    try {
      logger.debug('Finding active agents');
      const result = await this.model
        .find({ agentStatus: 'active', isDeleted: false })
        .populate('channelId')
        .populate('designationId')
        .populate('teamLeadId')
        .populate('reportingManagerId')
        .sort({ createdAt: -1 })
        .exec();
      logger.debug('Active agents found', { count: result.length });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find active agents:', {
        error: err.message,
        stack: err.stack,
      });
      throw error;
    }
  }

  public async findAgentsByChannelId(channelId: string): Promise<IAgent[]> {
    try {
      logger.debug('Finding agents by channel ID', { channelId });
      const result = await this.model
        .find({ channelId, isDeleted: false })
        .populate('channelId')
        .populate('designationId')
        .populate('teamLeadId')
        .populate('reportingManagerId')
        .sort({ createdAt: -1 })
        .exec();
      logger.debug('Agents found by channel ID', {
        channelId,
        count: result.length,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find agents by channel ID:', {
        error: err.message,
        stack: err.stack,
        channelId,
      });
      throw error;
    }
  }

  public async findWithPagination(
    filter: FilterQuery<IAgent> = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<{ agents: IAgent[]; total: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const baseFilter = { ...filter, isDeleted: false };

      logger.debug('Finding agents with pagination', {
        filter: baseFilter,
        page,
        limit,
        skip,
      });

      const [agents, total] = await Promise.all([
        this.model
          .find(baseFilter)
          .populate('channelId')
          .populate('designationId')
          .populate('teamLeadId')
          .populate('reportingManagerId')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.model.countDocuments(baseFilter).exec(),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.debug('Agents found with pagination', {
        count: agents.length,
        total,
        totalPages,
        page,
        limit,
      });

      return { agents, total, totalPages };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find agents with pagination:', {
        error: err.message,
        stack: err.stack,
        filter,
        page,
        limit,
      });
      throw error;
    }
  }

  public async findById(id: string): Promise<IAgent | null> {
    try {
      logger.debug('Finding agent by ID', { id });
      const result = await this.model
        .findOne({ _id: id, isDeleted: false })
        .populate('channelId')
        .populate('designationId')
        .populate('teamLeadId')
        .populate('reportingManagerId')
        .exec();
      logger.debug('Agent found by ID', { id, found: !!result });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find agent by ID:', {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }

  public async findAgentsByUserId(userId: string): Promise<IAgent[]> {
    try {
      logger.debug('Finding agents by user ID', { userId });
      const result = await this.model
        .find({ userId, isDeleted: false })
        .populate('channelId')
        .populate('designationId')
        .populate('teamLeadId')
        .populate('reportingManagerId')
        .sort({ createdAt: -1 })
        .exec();
      logger.debug('Agents found by user ID', {
        userId,
        count: result.length,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find agents by user ID:', {
        error: err.message,
        stack: err.stack,
        userId,
      });
      throw error;
    }
  }

  public async findAgentsByDesignationAndChannel(
    designationId: string,
    channelId: string,
  ): Promise<IAgent[]> {
    try {
      logger.debug('Finding agents by designation and channel', {
        designationId,
        channelId,
      });

      const agents = await AgentModel.find({
        designationId: new Types.ObjectId(designationId),
        channelId: new Types.ObjectId(channelId),
        isDeleted: false,
      }).populate(['channelId', 'designationId']);

      logger.debug('Found agents by designation and channel', {
        count: agents.length,
        designationId,
        channelId,
      });

      return agents;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find agents by designation and channel:', {
        error: err.message,
        stack: err.stack,
        designationId,
        channelId,
      });
      throw error;
    }
  }
}
