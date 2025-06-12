import type { Request, Response } from 'express';
import type { CreateAgentDto } from '@/modules/agent/dto/create-agent.dto';
import type { AgentResponseDto } from '@/modules/agent/dto/agent-response.dto';
import type { IAgent } from '@/models/agent.model';
import type { FilterQuery } from 'mongoose';

export interface IAgentRepository {
  create(data: Partial<IAgent>): Promise<IAgent>;
  findById(id: string): Promise<IAgent | null>;
  findByCode(code: string): Promise<IAgent | null>;
  findActiveAgents(): Promise<IAgent[]>;
  findAgentsByChannelId(channelId: string): Promise<IAgent[]>;
  findAgentsByUserId(userId: string): Promise<IAgent[]>;
  findWithPagination(
    filter?: FilterQuery<IAgent>,
    page?: number,
    limit?: number,
  ): Promise<{ agents: IAgent[]; total: number; totalPages: number }>;
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
  getAgentsByUserId(userId: string): Promise<AgentResponseDto[]>;
}

export interface IAgentController {
  createAgent(req: Request, res: Response): Promise<void>;
  getAgentById(req: Request, res: Response): Promise<void>;
  getAgentByCode(req: Request, res: Response): Promise<void>;
  getAllAgents(req: Request, res: Response): Promise<void>;
  getActiveAgents(req: Request, res: Response): Promise<void>;
  getAgentsByChannelId(req: Request, res: Response): Promise<void>;
  getAgentsByUserId(req: Request, res: Response): Promise<void>;
}
