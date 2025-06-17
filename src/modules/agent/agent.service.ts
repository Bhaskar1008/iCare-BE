import { AgentRepository } from '@/modules/agent/agent.repository';
import type { CreateAgentDto } from '@/modules/agent/dto/create-agent.dto';
import type { AgentResponseDto } from '@/modules/agent/dto/agent-response.dto';
import type { IAgent } from '@/models/agent.model';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';
import logger from '@/common/utils/logger';
import type {
  IAgentService,
  IAgentRepository,
} from '@/modules/agent/interfaces/agent.interface';
import { Types } from 'mongoose';
import type { IChannel } from '@/models/channel.model';
import type { IDesignation } from '@/models/designation.model';
import { HierarchyService } from '@/modules/hierarchy/hierarchy.service';
import { DesignationService } from '@/modules/designation/designation.service';

export class AgentService implements IAgentService {
  private agentRepository: IAgentRepository;

  constructor() {
    this.agentRepository = new AgentRepository();
  }

  public async createAgent(data: CreateAgentDto): Promise<AgentResponseDto> {
    try {
      logger.debug('Creating agent', { data });

      await this.validateAgentCode(data.agentCode);
      const agentData = this.prepareAgentData(data);
      const agent = await this.saveAgent(agentData);
      return await this.fetchPopulatedAgent(agent._id.toString());
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create agent:', {
        error: err.message,
        stack: err.stack,
        data,
      });
      throw error;
    }
  }

  private async validateAgentCode(agentCode: string): Promise<void> {
    const existingAgent = await this.agentRepository.findByCode(agentCode);
    if (existingAgent) {
      throw new DatabaseValidationException(
        `Agent with code '${agentCode}' already exists`,
      );
    }
  }

  private prepareAgentData(data: CreateAgentDto): Partial<IAgent> {
    return {
      userId: new Types.ObjectId(data.userId),
      channelId: new Types.ObjectId(data.channelId),
      designationId: new Types.ObjectId(data.designationId),
      agentCode: data.agentCode,
      employeeId: data.employeeId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      agentStatus: data.agentStatus ?? 'active',
      joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
      targetAmount: data.targetAmount,
      commissionPercentage: data.commissionPercentage,
      isTeamLead: data.isTeamLead ?? false,
      teamLeadId: data.teamLeadId
        ? new Types.ObjectId(data.teamLeadId)
        : undefined,
      reportingManagerId: data.reportingManagerId
        ? new Types.ObjectId(data.reportingManagerId)
        : undefined,
    };
  }

  private async saveAgent(agentData: Partial<IAgent>): Promise<IAgent> {
    const agent = await this.agentRepository.create(agentData);
    logger.info('Agent created successfully', {
      id: agent._id,
      code: agent.agentCode,
    });
    return agent;
  }

  private async fetchPopulatedAgent(
    agentId: string,
  ): Promise<AgentResponseDto> {
    const populatedAgent = await this.agentRepository.findById(agentId);
    if (!populatedAgent) {
      throw new Error(
        'Failed to retrieve created agent with populated references',
      );
    }
    return this.mapToResponseDto(populatedAgent);
  }

  public async getAgentById(id: string): Promise<AgentResponseDto | null> {
    try {
      logger.debug('Getting agent by ID', { id });
      const agent = await this.agentRepository.findById(id);

      if (!agent || agent.isDeleted) {
        logger.debug('Agent not found or deleted', { id });
        return null;
      }

      logger.debug('Agent found by ID', { id, code: agent.agentCode });
      return this.mapToResponseDto(agent);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get agent by ID:', {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }

  public async getAgentByCode(code: string): Promise<AgentResponseDto | null> {
    try {
      logger.debug('Getting agent by code', { code });
      const agent = await this.agentRepository.findByCode(code);

      if (!agent) {
        logger.debug('Agent not found by code', { code });
        return null;
      }

      logger.debug('Agent found by code', { code, id: agent._id });
      return this.mapToResponseDto(agent);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get agent by code:', {
        error: err.message,
        stack: err.stack,
        code,
      });
      throw error;
    }
  }

  public async getAllAgents(
    page: number = 1,
    limit: number = 10,
    status?: 'active' | 'inactive' | 'suspended',
    channelId?: string,
    userId?: string,
  ): Promise<{
    agents: AgentResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      logger.debug('Getting all agents', {
        page,
        limit,
        status,
        channelId,
        userId,
      });
      const filter = this.buildAgentFilter(status, channelId, userId);
      const result = await this.fetchAgentsWithPagination(filter, page, limit);
      return this.formatAgentListResponse(result, page, limit);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get all agents:', {
        error: err.message,
        stack: err.stack,
        page,
        limit,
        status,
        channelId,
        userId,
      });
      throw error;
    }
  }

  private buildAgentFilter(
    status?: 'active' | 'inactive' | 'suspended',
    channelId?: string,
    userId?: string,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {};
    if (status) filter.agentStatus = status;
    if (channelId) filter.channelId = new Types.ObjectId(channelId);
    if (userId) filter.userId = new Types.ObjectId(userId);
    return filter;
  }

  private async fetchAgentsWithPagination(
    filter: Record<string, unknown>,
    page: number,
    limit: number,
  ) {
    return await this.agentRepository.findWithPagination(filter, page, limit);
  }

  private formatAgentListResponse(
    result: { agents: IAgent[]; total: number; totalPages: number },
    page: number,
    limit: number,
  ) {
    logger.debug('Agents retrieved successfully', {
      count: result.agents.length,
      total: result.total,
      page,
      limit,
    });

    return {
      agents: result.agents.map(agent => this.mapToResponseDto(agent)),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  public async getActiveAgents(): Promise<AgentResponseDto[]> {
    try {
      logger.debug('Getting active agents');
      const agents = await this.agentRepository.findActiveAgents();

      logger.debug('Active agents retrieved successfully', {
        count: agents.length,
      });
      return agents.map(agent => this.mapToResponseDto(agent));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get active agents:', {
        error: err.message,
        stack: err.stack,
      });
      throw error;
    }
  }

  public async getAgentsByChannelId(
    channelId: string,
  ): Promise<AgentResponseDto[]> {
    try {
      logger.debug('Getting agents by channel ID', { channelId });
      const agents =
        await this.agentRepository.findAgentsByChannelId(channelId);

      logger.debug('Agents retrieved by channel ID successfully', {
        channelId,
        count: agents.length,
      });
      return agents.map(agent => this.mapToResponseDto(agent));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get agents by channel ID:', {
        error: err.message,
        stack: err.stack,
        channelId,
      });
      throw error;
    }
  }

  public async getAgentsByUserId(userId: string): Promise<AgentResponseDto[]> {
    try {
      logger.debug('Getting agents by user ID', { userId });
      const agents = await this.agentRepository.findAgentsByUserId(userId);

      logger.debug('Agents retrieved by user ID', {
        userId,
        count: agents.length,
      });

      return agents.map(agent => this.mapToResponseDto(agent));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get agents by user ID:', {
        error: err.message,
        stack: err.stack,
        userId,
      });
      throw error;
    }
  }

  private mapToResponseDto(agent: IAgent): AgentResponseDto {
    // Process channel data
    const channelData = this.extractChannelData(agent.channelId);

    // Process designation data
    const designationData = this.extractDesignationData(agent.designationId);

    // Process team lead data
    const teamLeadData = this.extractTeamLeadData(agent.teamLeadId);

    // Process reporting manager data
    const reportingManagerData = this.extractTeamLeadData(
      agent.reportingManagerId,
    );

    return {
      _id: agent._id,
      channelId: channelData.id,
      channelName: channelData.name,
      channelCode: channelData.code,
      designationId: designationData.id,
      designationName: designationData.name,
      designationCode: designationData.code,
      agentCode: agent.agentCode,
      employeeId: agent.employeeId,
      firstName: agent.firstName,
      middleName: agent.middleName,
      lastName: agent.lastName,
      displayName: agent.displayName,
      fullName:
        agent.firstName && agent.lastName
          ? `${agent.firstName} ${agent.middleName ? `${agent.middleName} ` : ''}${agent.lastName}`
          : undefined,
      email: agent.email,
      phoneNumber: agent.phoneNumber,
      agentStatus: agent.agentStatus,
      joiningDate: agent.joiningDate,
      targetAmount: agent.targetAmount,
      commissionPercentage: agent.commissionPercentage,
      isTeamLead: agent.isTeamLead,
      teamLeadId: teamLeadData.id,
      teamLeadName: teamLeadData.name,
      teamLeadCode: teamLeadData.code,
      reportingManagerId: reportingManagerData.id,
      reportingManagerName: reportingManagerData.name,
      reportingManagerCode: reportingManagerData.code,
      profilePictureUrl: agent.profilePictureUrl,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    };
  }

  private extractChannelData(channelId: unknown): {
    id: string | Types.ObjectId;
    name?: string;
    code?: string;
  } {
    if (!channelId) {
      return { id: '' };
    }

    if (channelId instanceof Types.ObjectId) {
      return { id: channelId };
    }

    // Handle populated channel object
    if (typeof channelId === 'object' && channelId !== null) {
      const channel = channelId as IChannel;
      if (channel._id) {
        return {
          id: channel._id,
          name: channel.channelName,
          code: channel.channelCode,
        };
      }
    }

    // Only convert primitive types to string (not objects)
    if (
      typeof channelId === 'string' ||
      typeof channelId === 'number' ||
      typeof channelId === 'boolean'
    ) {
      return { id: String(channelId) };
    }

    // Fallback for other types
    return { id: '' };
  }

  private extractDesignationData(designationId: unknown): {
    id: string | Types.ObjectId;
    name?: string;
    code?: string;
  } {
    if (!designationId) {
      return { id: '' };
    }

    if (designationId instanceof Types.ObjectId) {
      return { id: designationId };
    }

    // Handle populated designation object
    if (typeof designationId === 'object' && designationId !== null) {
      const designation = designationId as IDesignation;
      if (designation._id) {
        return {
          id: designation._id,
          name: designation.designationName,
          code: designation.designationCode,
        };
      }
    }

    // Only convert primitive types to string (not objects)
    if (
      typeof designationId === 'string' ||
      typeof designationId === 'number' ||
      typeof designationId === 'boolean'
    ) {
      return { id: String(designationId) };
    }

    // Fallback for other types
    return { id: '' };
  }

  private extractTeamLeadData(teamLeadId: unknown): {
    id?: string | Types.ObjectId;
    name?: string;
    code?: string;
  } {
    if (!teamLeadId) {
      return { id: undefined };
    }

    if (teamLeadId instanceof Types.ObjectId) {
      return { id: teamLeadId };
    }

    // Handle populated team lead object
    if (typeof teamLeadId === 'object' && teamLeadId !== null) {
      const teamLead = teamLeadId as IAgent;
      if (teamLead._id) {
        const fullName =
          teamLead.firstName && teamLead.lastName
            ? `${teamLead.firstName} ${teamLead.middleName ? `${teamLead.middleName} ` : ''}${teamLead.lastName}`
            : undefined;

        return {
          id: teamLead._id,
          name: fullName ?? teamLead.displayName,
          code: teamLead.agentCode,
        };
      }
    }

    // Only convert primitive types to string (not objects)
    if (
      typeof teamLeadId === 'string' ||
      typeof teamLeadId === 'number' ||
      typeof teamLeadId === 'boolean'
    ) {
      return { id: String(teamLeadId) };
    }

    // Fallback for other types
    return { id: undefined };
  }

  public async getAgentHierarchyInfo(
    agentId: string,
    hierarchyId?: string,
    channelId?: string,
  ): Promise<{
    hierarchies?: { hierarchyName: string; hierarchyId: string }[];
    agents?: { firstName: string; lastName: string; id: string }[];
  }> {
    try {
      logger.debug('Getting agent hierarchy info', {
        agentId,
        hierarchyId,
        channelId,
      });

      // Get agent's designation
      const agent = await this.agentRepository.findById(agentId);
      if (!agent) {
        throw new Error('Agent not found');
      }

      // Get hierarchy information
      const hierarchyService = new HierarchyService();
      const agentChannelId =
        typeof agent.channelId === 'string'
          ? agent.channelId
          : agent.channelId &&
              typeof agent.channelId === 'object' &&
              '_id' in agent.channelId
            ? agent.channelId._id.toString()
            : '';
      const hierarchies =
        await hierarchyService.getHierarchiesByChannel(agentChannelId);

      // Find hierarchy with level code 18
      const targetHierarchy = hierarchies.find(
        h => h.hierarchyLevelCode === '18',
      );
      if (!targetHierarchy) {
        throw new Error('Target hierarchy level 18 not found');
      }

      // If only agentId is provided, return hierarchies
      if (!hierarchyId || !channelId) {
        // Get hierarchies with level less than 18
        const filteredHierarchies = hierarchies
          .filter(h => Number(h.hierarchyLevelCode) < 18)
          .map(h => ({
            hierarchyName: h.hierarchyName,
            hierarchyId: h._id.toString(),
          }));

        logger.debug('Returning hierarchies list', {
          count: filteredHierarchies.length,
        });

        return {
          hierarchies: filteredHierarchies,
        };
      }

      // If hierarchyId and channelId are provided, return agents
      const designationService = new DesignationService();
      const designations =
        await designationService.getDesignationsByHierarchyId(hierarchyId);

      const agentPromises = designations.map(async designation => {
        const agents =
          await this.agentRepository.findAgentsByDesignationAndChannel(
            designation._id.toString(),
            channelId,
          );
        return agents;
      });

      const agentResults = await Promise.all(agentPromises);
      const agents = agentResults
        .flat()
        .filter((agent: IAgent) => agent.firstName && agent.lastName)
        .map((agent: IAgent) => ({
          firstName: agent.firstName!,
          lastName: agent.lastName!,
          id: agent._id.toString(),
        }));

      logger.debug('Returning agents list', {
        count: agents.length,
      });

      return {
        agents,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get agent hierarchy info:', {
        error: err.message,
        stack: err.stack,
        agentId,
        hierarchyId,
        channelId,
      });
      throw error;
    }
  }
}
