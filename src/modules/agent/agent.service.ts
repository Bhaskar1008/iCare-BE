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
import { HierarchyService } from '@/modules/hierarchy/hierarchy.service';
import { DesignationService } from '@/modules/designation/designation.service';
import {
  generateAgentCode,
  isAgentCodeUnique,
} from './utils/agent-code-generator';
import { HierarchyRepository } from '@/modules/hierarchy/hierarchy.repository';
import { DatabaseException } from '@/common/exceptions/database.exception';
import { UserModel } from '@/models/user.model';
import type { DesignationResponseDto } from '../designation/dto/designation-response.dto';

interface BulkUploadResult {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  errors: Array<{
    row: number;
    error: string;
    data: Record<string, any>;
  }>;
  createdAgents: Array<{
    agentCode: string;
    email: string;
    name: string;
  }>;
}

export class AgentService implements IAgentService {
  private agentRepository: IAgentRepository;
  private hierarchyRepository: HierarchyRepository;
  private hierarchyService: HierarchyService;
  private designationService: DesignationService;

  constructor() {
    this.agentRepository = new AgentRepository();
    this.hierarchyRepository = new HierarchyRepository();
    this.hierarchyService = new HierarchyService();
    this.designationService = new DesignationService();
  }

  public async createAgent(data: CreateAgentDto): Promise<AgentResponseDto> {
    try {
      logger.debug('Creating agent', { data });

      // Handle agent code generation or validation
      let agentCode: string;

      if (data.generateAgentCode && data.projectId) {
        // Generate agent code based on project
        agentCode = await generateAgentCode(data.projectId);
        logger.debug('Generated agent code', {
          agentCode,
          projectId: data.projectId,
        });
      } else if (data.agentCode) {
        // Validate manually provided agent code
        agentCode = data.agentCode;
        const isUnique = await isAgentCodeUnique(agentCode);

        if (!isUnique) {
          throw new DatabaseValidationException(
            `Agent with code '${agentCode}' already exists`,
          );
        }
      } else {
        throw new DatabaseValidationException(
          'Either agent code or generate agent code flag with project ID must be provided',
        );
      }

      const agentData = this.prepareAgentData(data, agentCode);
      const agent = await this.agentRepository.create(agentData);
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

  private prepareAgentData(
    data: CreateAgentDto,
    agentCode: string,
  ): Partial<IAgent> {
    return {
      userId: new Types.ObjectId(data.userId),
      channelId: new Types.ObjectId(data.channelId),
      designationId: new Types.ObjectId(data.designationId),
      projectId: data.projectId
        ? new Types.ObjectId(data.projectId)
        : undefined,
      agentCode,
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
    projectId?: string,
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
        projectId,
      });
      const filter = this.buildAgentFilter(
        status,
        channelId,
        userId,
        projectId,
      );
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
        projectId,
      });
      throw error;
    }
  }

  private buildAgentFilter(
    status?: 'active' | 'inactive' | 'suspended',
    channelId?: string,
    userId?: string,
    projectId?: string,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {};
    if (status) filter.agentStatus = status;
    if (channelId) filter.channelId = new Types.ObjectId(channelId);
    if (userId) filter.userId = new Types.ObjectId(userId);
    if (projectId) filter.projectId = new Types.ObjectId(projectId);
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

  public async getAgentsByProjectId(
    projectId: string,
  ): Promise<AgentResponseDto[]> {
    try {
      logger.debug('Getting agents by project ID', { projectId });
      const agents =
        await this.agentRepository.findAgentsByProjectId(projectId);

      logger.debug('Agents retrieved by project ID successfully', {
        projectId,
        count: agents.length,
      });
      return agents.map(agent => this.mapToResponseDto(agent));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get agents by project ID:', {
        error: err.message,
        stack: err.stack,
        projectId,
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

  public async getAgentHierarchyInfo(
    agentId: string,
    requestedHierarchyId?: string,
    requestedChannelId?: string,
  ): Promise<{
    hierarchies?: { hierarchyName: string; hierarchyId: string }[];
    agents?: { firstName: string; lastName: string; id: string }[];
  }> {
    try {
      logger.debug('Getting agent hierarchy info', {
        agentId,
        hierarchyId: requestedHierarchyId,
        channelId: requestedChannelId,
      });

      // Get agent details with designation
      const agent = await this.agentRepository.findById(agentId);
      if (!agent) {
        throw new Error('Agent not found');
      }

      // Get agent's designation and hierarchy level
      const designationId = agent.designationId;
      if (!designationId) {
        throw new Error('Agent has no designation');
      }

      logger.debug('Converting designation ID', {
        originalDesignationId: designationId,
        isString: typeof designationId === 'string',
        isObjectId: designationId instanceof Types.ObjectId,
        isPopulatedDocument:
          typeof designationId === 'object' && '_id' in designationId,
        designationIdType: typeof designationId,
        designationIdValue: JSON.stringify(designationId),
      });

      // Validate and convert designationId to string
      let designationIdString: string | null = null;

      if (typeof designationId === 'string') {
        // If it's a string, validate it's a valid ObjectId string
        designationIdString = Types.ObjectId.isValid(designationId)
          ? designationId
          : null;
      } else if (designationId instanceof Types.ObjectId) {
        designationIdString = designationId.toString();
      } else if (typeof designationId === 'object' && designationId !== null) {
        // Handle populated document
        if ('_id' in designationId && designationId._id) {
          const docId = designationId._id;
          // Check if it's an ObjectId using isValid
          if (Types.ObjectId.isValid(docId)) {
            designationIdString = docId.toString();
          }
        }
      }

      if (!designationIdString) {
        logger.error(
          'Failed to convert designation ID to valid ObjectId string',
          {
            originalDesignationId: designationId,
            type: typeof designationId,
            value: JSON.stringify(designationId),
          },
        );
        throw new Error(
          'Invalid designation ID format - must be a valid MongoDB ObjectId',
        );
      }

      logger.debug('Successfully converted designation ID', {
        originalDesignationId: designationId,
        convertedDesignationId: designationIdString,
      });

      const designation =
        await this.designationService.getDesignationById(designationIdString);

      if (!designation) {
        throw new Error('Agent designation not found');
      }

      // Get hierarchy from designation
      let agentHierarchyId: string;
      const hierarchy = designation.hierarchy;

      if (typeof hierarchy === 'string') {
        agentHierarchyId = hierarchy;
      } else if (hierarchy instanceof Types.ObjectId) {
        agentHierarchyId = hierarchy.toString();
      } else if (
        typeof hierarchy === 'object' &&
        hierarchy &&
        '_id' in hierarchy
      ) {
        agentHierarchyId = hierarchy._id.toString();
      } else {
        throw new Error('Invalid hierarchy ID in designation');
      }

      const hierarchyDetails =
        await this.hierarchyService.getHierarchyById(agentHierarchyId);
      if (!hierarchyDetails) {
        throw new Error('Hierarchy not found');
      }

      const agentHierarchyLevel = hierarchyDetails.hierarchyLevelCode;

      // Get all hierarchies for the channel
      const agentChannelId =
        typeof agent.channelId === 'string'
          ? agent.channelId
          : agent.channelId instanceof Types.ObjectId
            ? agent.channelId.toString()
            : '_id' in agent.channelId
              ? agent.channelId._id.toString()
              : null;

      if (!agentChannelId || !Types.ObjectId.isValid(agentChannelId)) {
        logger.error('Invalid channel ID format', {
          channelId: agent.channelId,
          agentId,
        });
        throw new DatabaseException(
          'Invalid channel ID format',
          'INVALID_CHANNEL_ID',
          400,
        );
      }

      const hierarchies =
        await this.hierarchyService.getHierarchiesByChannel(agentChannelId);

      // Find the target hierarchy based on agent's hierarchy level
      const targetHierarchy = hierarchies.find(
        h => h.hierarchyLevelCode === agentHierarchyLevel,
      );
      if (!targetHierarchy) {
        throw new Error(
          `Target hierarchy level ${agentHierarchyLevel} not found`,
        );
      }

      // If only agentId is provided, return hierarchies
      if (!requestedHierarchyId || !requestedChannelId) {
        // Get hierarchies with level less than agent's level
        const filteredHierarchies = hierarchies
          .filter(
            h => Number(h.hierarchyLevelCode) < Number(agentHierarchyLevel),
          )
          .sort(
            (a, b) =>
              Number(a.hierarchyLevelCode) - Number(b.hierarchyLevelCode),
          )
          .map(h => ({
            hierarchyName: h.hierarchyName,
            hierarchyId: h._id.toString(),
          }));

        return {
          hierarchies: filteredHierarchies,
        };
      }

      // If hierarchyId and channelId are provided, return agents
      const designations =
        await this.designationService.getDesignationsByHierarchyId(
          requestedHierarchyId,
        );

      const agentPromises = designations.map(async designation => {
        return this.agentRepository.findAgentsByDesignationAndChannel(
          typeof designation._id === 'string'
            ? designation._id
            : designation._id.toString(),
          requestedChannelId,
        );
      });

      const agentResults = await Promise.all(agentPromises);
      const agents = agentResults
        .flat()
        .filter(agent => agent.firstName && agent.lastName)
        .map(agent => ({
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
      logger.error('Failed to get agent hierarchy info:', {
        error,
        agentId,
        hierarchyId: requestedHierarchyId,
        channelId: requestedChannelId,
      });
      throw error;
    }
  }

  public async getAgentHierarchyWithAgents(
    agentId: string,
    channelId: string,
  ): Promise<{
    hierarchies: {
      hierarchyName: string;
      hierarchyId: string;
      agents: {
        firstName: string;
        lastName: string;
        id: string;
        agentCode: string;
        designationName?: string;
      }[];
    }[];
  }> {
    try {
      logger.debug('Getting agent hierarchy with agents', {
        agentId,
        channelId,
      });

      this.validateObjectIds(agentId, channelId);

      const agent = await this.getAgentOrThrow(agentId);
      const agentDesignation = await this.resolveDesignationWithHierarchy(
        agent.designationId,
      );

      const agentHierarchyLevelCode =
        await this.extractHierarchyLevelCode(agentDesignation);

      const allHierarchies =
        await this.hierarchyService.getHierarchiesByChannel(channelId);
      const filteredHierarchies = this.filterHierarchiesBelowLevel(
        allHierarchies,
        agentHierarchyLevelCode,
      );

      const hierarchiesWithAgents = await this.getAgentsForFilteredHierarchies(
        filteredHierarchies,
        channelId,
      );

      return { hierarchies: hierarchiesWithAgents };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get agent hierarchy with agents:', {
        error: err.message,
        stack: err.stack,
        agentId,
        channelId,
      });
      throw err;
    }
  }

  private validateObjectIds(agentId: string, channelId: string) {
    if (!Types.ObjectId.isValid(agentId)) {
      throw new DatabaseException(
        'Invalid agent ID format',
        'INVALID_AGENT_ID',
        400,
      );
    }
    if (!Types.ObjectId.isValid(channelId)) {
      throw new DatabaseException(
        'Invalid channel ID format',
        'INVALID_CHANNEL_ID',
        400,
      );
    }
  }

  private async getAgentOrThrow(agentId: string) {
    const agent = await this.agentRepository.findById(agentId);
    if (!agent) throw new Error('Agent not found');
    return agent;
  }

  private async resolveDesignationWithHierarchy(rawDesignationId: any) {
    let designationId: string;
    let designationData: any;

    if (typeof rawDesignationId === 'object' && rawDesignationId?._id) {
      designationId = rawDesignationId._id.toString();
      designationData = rawDesignationId;

      if (!rawDesignationId.hierarchy?._id) {
        designationData = await this.designationService.getDesignationById(
          designationId,
          true,
        );
      }
    } else {
      designationId = rawDesignationId.toString();
      designationData = await this.designationService.getDesignationById(
        designationId,
        true,
      );
    }

    if (!designationData) throw new Error('Agent designation not found');
    return designationData as DesignationResponseDto;
  }

  private async extractHierarchyLevelCode(
    agentDesignation: any,
  ): Promise<string> {
    if (typeof agentDesignation.hierarchy === 'string') {
      const hierarchy = await this.hierarchyService.getHierarchyById(
        agentDesignation.hierarchy as string,
      );
      if (!hierarchy) throw new Error('Agent hierarchy not found');
      return hierarchy.hierarchyLevelCode;
    }

    if (agentDesignation.hierarchy?.hierarchyLevelCode) {
      return agentDesignation.hierarchy.hierarchyLevelCode as string;
    }

    throw new Error('Invalid hierarchy format or missing hierarchyLevelCode');
  }

  private filterHierarchiesBelowLevel(
    hierarchies: any[],
    agentLevelCode: string,
  ) {
    return hierarchies
      .filter(h => Number(h.hierarchyLevelCode) < Number(agentLevelCode))
      .sort(
        (a, b) => Number(a.hierarchyLevelCode) - Number(b.hierarchyLevelCode),
      )
      .map(h => ({
        hierarchyName: h.hierarchyName,
        hierarchyId: h._id.toString(),
        hierarchyLevelCode: h.hierarchyLevelCode,
        agents: [] as {
          firstName: string;
          lastName: string;
          id: string;
          agentCode: string;
          designationName?: string;
        }[],
      }));
  }

  private async getAgentsForFilteredHierarchies(
    filteredHierarchies: any[],
    channelId: string,
  ): Promise<any[]> {
    const result: any[] = [];

    for (const hierarchy of filteredHierarchies) {
      const designations =
        await this.designationService.getDesignationsByHierarchyId(
          hierarchy.hierarchyId as string,
        );

      const agents: any[] = [];

      for (const designation of designations) {
        const foundAgents =
          await this.agentRepository.findAgentsByDesignationAndChannel(
            designation._id.toString(),
            channelId,
          );

        const activeAgents = foundAgents
          .filter(
            a =>
              a.firstName &&
              a.lastName &&
              !a.isDeleted &&
              a.agentStatus === 'active',
          )
          .map(a => ({
            firstName: a.firstName!,
            lastName: a.lastName!,
            id: a._id.toString(),
            agentCode: a.agentCode,
            designationName: designation.designationName,
          }));

        agents.push(...activeAgents);
      }

      if (agents.length) {
        result.push({
          hierarchyName: hierarchy.hierarchyName,
          hierarchyId: hierarchy.hierarchyId,
          agents,
        });
      }
    }

    return result;
  }

  private mapToResponseDto(agent: IAgent): AgentResponseDto {
    // Process channel data
    const channelData = this.extractChannelData(agent.channelId);

    // Process designation data
    const designationData = this.extractDesignationData(agent.designationId);

    // Process project data
    const projectData = this.extractProjectData(agent.projectId);

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
      projectId: projectData.id,
      projectName: projectData.name,
      projectCode: projectData.code,
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

  private extractChannelData(channel: unknown): {
    id: string | Types.ObjectId;
    name?: string;
    code?: string;
  } {
    if (!channel) return { id: '' };

    if (channel instanceof Types.ObjectId) {
      return { id: channel };
    }

    // Handle populated channel object
    if (typeof channel === 'object' && channel !== null) {
      const channelObj = channel as Record<string, unknown>;
      if (channelObj._id) {
        return {
          id: this.safeString(channelObj._id),
          name:
            typeof channelObj.channelName === 'string'
              ? channelObj.channelName
              : undefined,
          code:
            typeof channelObj.channelCode === 'string' ||
            typeof channelObj.channelCode === 'number'
              ? String(channelObj.channelCode)
              : undefined,
        };
      }
    }

    // Only convert primitive types to string (not objects)
    if (
      typeof channel === 'string' ||
      typeof channel === 'number' ||
      typeof channel === 'boolean'
    ) {
      return { id: String(channel) };
    }

    // Fallback for other types
    return { id: '' };
  }

  private extractDesignationData(designation: unknown): {
    id: string | Types.ObjectId;
    name?: string;
    code?: string;
  } {
    if (!designation) return { id: '' };

    if (designation instanceof Types.ObjectId) {
      return { id: designation };
    }

    // Handle populated designation object
    if (typeof designation === 'object' && designation !== null) {
      const designationObj = designation as Record<string, unknown>;
      if (designationObj._id) {
        return {
          id: this.safeString(designationObj._id),
          name:
            typeof designationObj.designationName === 'string'
              ? designationObj.designationName
              : undefined,
          code:
            typeof designationObj.designationCode === 'string' ||
            typeof designationObj.designationCode === 'number'
              ? String(designationObj.designationCode)
              : undefined,
        };
      }
    }

    // Only convert primitive types to string (not objects)
    if (
      typeof designation === 'string' ||
      typeof designation === 'number' ||
      typeof designation === 'boolean'
    ) {
      return { id: String(designation) };
    }

    // Fallback for other types
    return { id: '' };
  }

  private extractProjectData(project: unknown): {
    id?: string | Types.ObjectId;
    name?: string;
    code?: string;
  } {
    if (!project) return { id: undefined };

    if (project instanceof Types.ObjectId) {
      return { id: project };
    }

    // Handle populated project object
    if (typeof project === 'object' && project !== null) {
      const projectObj = project as Record<string, unknown>;
      if (projectObj._id) {
        return {
          id: this.safeString(projectObj._id),
          name:
            typeof projectObj.projectName === 'string'
              ? projectObj.projectName
              : undefined,
          code:
            typeof projectObj.projectCode === 'string' ||
            typeof projectObj.projectCode === 'number'
              ? String(projectObj.projectCode)
              : undefined,
        };
      }
    }

    // Only convert primitive types to string (not objects)
    if (
      typeof project === 'string' ||
      typeof project === 'number' ||
      typeof project === 'boolean'
    ) {
      return { id: String(project) };
    }

    // Fallback for other types
    return { id: undefined };
  }

  private extractTeamLeadData(teamLead: unknown): {
    id?: string | Types.ObjectId;
    name?: string;
    code?: string;
  } {
    if (!teamLead) return { id: undefined };

    if (teamLead instanceof Types.ObjectId) {
      return { id: teamLead };
    }

    // Handle populated team lead object
    if (typeof teamLead === 'object' && teamLead !== null) {
      const teamLeadObj = teamLead as Record<string, unknown>;
      if (teamLeadObj._id) {
        const fullName =
          typeof teamLeadObj.firstName === 'string' &&
          typeof teamLeadObj.lastName === 'string'
            ? `${teamLeadObj.firstName} ${
                typeof teamLeadObj.middleName === 'string'
                  ? `${teamLeadObj.middleName} `
                  : ''
              }${teamLeadObj.lastName}`
            : undefined;

        return {
          id: this.safeString(teamLeadObj._id),
          name:
            fullName ??
            (typeof teamLeadObj.displayName === 'string'
              ? teamLeadObj.displayName
              : undefined),
          code:
            typeof teamLeadObj.agentCode === 'string'
              ? teamLeadObj.agentCode
              : undefined,
        };
      }
    }

    // Only convert primitive types to string (not objects)
    if (
      typeof teamLead === 'string' ||
      typeof teamLead === 'number' ||
      typeof teamLead === 'boolean'
    ) {
      return { id: String(teamLead) };
    }

    // Fallback for other types
    return { id: undefined };
  }

  private safeString(value: unknown): string {
    if (value === null || value === undefined) return '';

    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean')
      return String(value);

    if (value instanceof Types.ObjectId) return value.toString();

    if (
      typeof value === 'object' &&
      value !== null &&
      'toString' in value &&
      typeof (value as { toString(): string }).toString === 'function'
    ) {
      return (value as { toString(): string }).toString();
    }

    return '';
  }

  public async bulkCreateAgents(
    data: Record<string, any>[],
    projectId: string,
  ): Promise<BulkUploadResult> {
    const result: BulkUploadResult = {
      success: true,
      totalProcessed: data.length,
      successCount: 0,
      failureCount: 0,
      errors: [],
      createdAgents: [],
    };

    try {
      // Find the user associated with the project and role='user'
      const user = await UserModel.findOne({
        projectId: new Types.ObjectId(projectId),
        role: 'user',
      });

      if (!user) {
        throw new Error('No user found associated with the project');
      }

      // Process each row
      for (const [index, row] of data.entries()) {
        try {
          // Validate required fields
          if (
            !row.firstName ||
            !row.lastName ||
            !row.email ||
            !row.phoneNumber ||
            !row.channelId ||
            !row.designationId
          ) {
            result.errors.push({
              row: index + 1,
              error:
                'Missing required fields (firstName, lastName, email, phoneNumber, channelId, designationId)',
              data: row,
            });
            result.failureCount++;
            continue;
          }

          // Validate channelId and designationId format
          if (
            !Types.ObjectId.isValid(row.channelId as string) ||
            !Types.ObjectId.isValid(row.designationId as string)
          ) {
            result.errors.push({
              row: index + 1,
              error: 'Invalid channelId or designationId format',
              data: row,
            });
            result.failureCount++;
            continue;
          }

          // Generate agent code
          const agentCode = await generateAgentCode(projectId);

          // Create agent
          const agent = await this.createAgent({
            userId: user._id.toString(),
            channelId: row.channelId,
            designationId: row.designationId,
            projectId,
            agentCode,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phoneNumber: row.phoneNumber,
            agentStatus: 'active',
            isTeamLead: false,
          });

          result.successCount++;
          result.createdAgents.push({
            agentCode: agent.agentCode,
            email: agent.email!,
            name: `${agent.firstName} ${agent.lastName}`,
          });
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          result.errors.push({
            row: index + 1,
            error: err.message,
            data: row,
          });
          result.failureCount++;
        }
      }

      result.success = result.failureCount === 0;
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to process bulk agent creation:', {
        error: err.message,
        stack: err.stack,
        projectId,
        dataLength: data.length,
      });
      throw err;
    }
  }
}
