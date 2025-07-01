import type { Types } from 'mongoose';
import type { IUser } from '@/models/user.model';
import type { Request, Response } from 'express';
import type { CreateAgentDto } from '@/modules/agent/dto/create-agent.dto';
import type { AgentResponseDto } from '@/modules/agent/dto/agent-response.dto';
import type { FilterQuery } from 'mongoose';
import type { IAgent as IAgentModel } from '@/models/agent.model';

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

export interface IAgentRepository {
  create(data: Partial<IAgentModel>): Promise<IAgentModel>;
  findById(id: string): Promise<IAgentModel | null>;
  findByCode(code: string): Promise<IAgentModel | null>;
  findActiveAgents(): Promise<IAgentModel[]>;
  findAgentsByChannelId(channelId: string): Promise<IAgentModel[]>;
  findAgentsByProjectId(projectId: string): Promise<IAgentModel[]>;
  findAgentsByUserId(userId: string): Promise<IAgentModel[]>;
  findWithPagination(
    filter?: FilterQuery<IAgentModel>,
    page?: number,
    limit?: number,
  ): Promise<{ agents: IAgentModel[]; total: number; totalPages: number }>;
  findAgentsByDesignationAndChannel(
    designationId: string,
    channelId: string,
  ): Promise<IAgentModel[]>;
  findOne(filter: FilterQuery<IAgentModel>): Promise<IAgentModel | null>;
}

export interface IAgentService {
  createAgent(data: CreateAgentDto): Promise<AgentResponseDto>;
  getAgentById(id: string): Promise<AgentResponseDto | null>;
  getAgentByCode(code: string): Promise<AgentResponseDto | null>;
  getAllAgents(
    page?: number,
    limit?: number,
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
  }>;
  getActiveAgents(): Promise<AgentResponseDto[]>;
  getAgentsByChannelId(channelId: string): Promise<AgentResponseDto[]>;
  getAgentsByProjectId(projectId: string): Promise<AgentResponseDto[]>;
  getAgentsByUserId(userId: string): Promise<AgentResponseDto[]>;
  getAgentHierarchyInfo(
    agentId: string,
    hierarchyId?: string,
    channelId?: string,
  ): Promise<{
    hierarchies?: { hierarchyName: string; hierarchyId: string }[];
    agents?: { firstName: string; lastName: string; id: string }[];
  }>;
  getAgentHierarchyWithAgents(
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
  }>;
  bulkCreateAgents(
    data: Record<string, any>[],
    projectId: string,
  ): Promise<BulkUploadResult>;
}

export interface IAgentController {
  createAgent(req: Request, res: Response): Promise<void>;
  getAllAgents(req: Request, res: Response): Promise<void>;
  getAgentById(req: Request, res: Response): Promise<void>;
  getAgentByCode(req: Request, res: Response): Promise<void>;
  getAgentsByChannelId(req: Request, res: Response): Promise<void>;
  getAgentsByProjectId(req: Request, res: Response): Promise<void>;
  getActiveAgents(req: Request, res: Response): Promise<void>;
  getAgentsByUserId(req: Request, res: Response): Promise<void>;
  bulkUploadAgents(req: Request, res: Response): Promise<void>;
}

export interface IAgent {
  _id?: Types.ObjectId;
  userId: Types.ObjectId | IUser;
  channelId: Types.ObjectId;
  designationId: Types.ObjectId;
  projectId?: Types.ObjectId;
  agentCode: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  agentStatus: 'active' | 'inactive' | 'suspended';
  joiningDate?: Date;
  targetAmount?: number;
  commissionPercentage?: number;
  isTeamLead?: boolean;
  teamLeadId?: Types.ObjectId;
  reportingManagerId?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}
