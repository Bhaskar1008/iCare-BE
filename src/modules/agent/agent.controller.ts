import type { Request, Response } from 'express';
import { BaseController } from '@/controllers/base.controller';
import { AgentService } from '@/modules/agent/agent.service';
import type { CreateAgentDto } from '@/modules/agent/dto/create-agent.dto';
import type { AgentQueryDto } from '@/modules/agent/dto/agent-query.dto';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';
import {
  HTTP_STATUS,
  PAGINATION,
} from '@/common/constants/http-status.constants';
import logger from '@/common/utils/logger';
import type {
  IAgentController,
  IAgentService,
} from '@/modules/agent/interfaces/agent.interface';
import type { ValidatedRequest } from '@/common/interfaces/validation.interface';
import type { GetAgentHierarchyDto } from './dto/get-agent-hierarchy.dto';
import { BulkAgentUploadService } from './services/bulk-agent-upload.service';
import { AgentRepository } from './agent.repository';
import { ChannelRepository } from '../channel/channel.repository';
import { DesignationRepository } from '../designation/designation.repository';
import { UserRepository } from '../user/user.repository';
import { ProjectRepository } from '../project/project.repository';
import { BadRequestException } from '@/common/exceptions/bad-request.exception';

export class AgentController
  extends BaseController
  implements IAgentController
{
  private agentService: IAgentService;
  private readonly agentRepository: AgentRepository;
  private readonly bulkAgentUploadService: BulkAgentUploadService;

  constructor() {
    super();
    this.agentService = new AgentService();
    this.agentRepository = new AgentRepository();
    const channelRepository = new ChannelRepository();
    const designationRepository = new DesignationRepository();
    const userRepository = new UserRepository();
    const projectRepository = new ProjectRepository();

    this.bulkAgentUploadService = new BulkAgentUploadService(
      this.agentRepository,
      channelRepository,
      designationRepository,
      userRepository,
      projectRepository,
    );
  }

  public createAgent = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.debug('Create agent request received', req.body);

      // Validate that either agentCode or generateAgentCode is provided
      const { agentCode, generateAgentCode, projectId } = req.body;

      if (!agentCode && !generateAgentCode) {
        this.sendBadRequest(
          res,
          'Either agentCode or generateAgentCode must be provided',
        );
        return;
      }

      // If generateAgentCode is true, projectId is required
      if (generateAgentCode && !projectId) {
        this.sendBadRequest(
          res,
          'Project ID is required when generating agent code automatically',
        );
        return;
      }

      // req.body is now validated and transformed by ValidationPipe
      const agentData = req.body as CreateAgentDto;
      const agent = await this.agentService.createAgent(agentData);

      logger.info('Agent created successfully', {
        id: agent._id,
        code: agent.agentCode,
      });

      this.sendCreated(res, agent, 'Agent created successfully');
    } catch (error) {
      this.handleCreateAgentError(error, req, res);
    }
  };

  private handleCreateAgentError(
    error: unknown,
    req: Request,
    res: Response,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to create agent:', {
      error: err.message,
      stack: err.stack,
    });

    if (error instanceof DatabaseValidationException) {
      this.sendBadRequest(res, err.message);
      return;
    }

    this.sendError(
      res,
      'Failed to create agent',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }

  public getAgentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Get agent by ID request received', { id });

      if (!id) {
        this.sendBadRequest(res, 'Agent ID is required');
        return;
      }

      const agent = await this.agentService.getAgentById(id);

      if (!agent) {
        this.sendNotFound(res, 'Agent not found');
        return;
      }

      logger.debug('Agent retrieved successfully', {
        id,
        code: agent.agentCode,
      });
      this.sendSuccess(res, agent, 'Agent retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get agent by ID:', {
        error: err.message,
        stack: err.stack,
        id: req.params.id,
      });

      this.sendError(
        res,
        'Failed to retrieve agent',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getAgentByCode = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { code } = req.params;
      logger.debug('Get agent by code request received', { code });

      if (!code) {
        this.sendBadRequest(res, 'Agent code is required');
        return;
      }

      const agent = await this.agentService.getAgentByCode(code);

      if (!agent) {
        this.sendNotFound(res, 'Agent not found');
        return;
      }

      logger.debug('Agent retrieved successfully', { code, id: agent._id });
      this.sendSuccess(res, agent, 'Agent retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get agent by code:', {
        error: err.message,
        stack: err.stack,
        code: req.params.code,
      });

      this.sendError(
        res,
        'Failed to retrieve agent',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getAllAgents = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.debug('Get all agents request received', { query: req.query });

      const queryParams = (req as ValidatedRequest<AgentQueryDto>)
        .validatedQuery;
      const page = queryParams.page
        ? parseInt(queryParams.page, 10)
        : PAGINATION.DEFAULT_PAGE;
      const limit = queryParams.limit
        ? parseInt(queryParams.limit, 10)
        : PAGINATION.DEFAULT_LIMIT;
      const status = queryParams.status;
      const channelId = queryParams.channelId;
      const userId = queryParams.userId;
      const projectId = queryParams.projectId;

      const result = await this.agentService.getAllAgents(
        page,
        limit,
        status,
        channelId,
        userId,
        projectId,
      );

      logger.debug('Agents retrieved successfully', {
        count: result.agents.length,
        total: result.pagination.total,
        page,
        limit,
      });

      this.sendSuccess(res, result, 'Agents retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get all agents:', {
        error: err.message,
        stack: err.stack,
        query: req.query,
      });

      this.sendError(
        res,
        'Failed to retrieve agents',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getActiveAgents = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Get active agents request received');

      const agents = await this.agentService.getActiveAgents();

      logger.debug('Active agents retrieved successfully', {
        count: agents.length,
      });
      this.sendSuccess(res, agents, 'Active agents retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get active agents:', {
        error: err.message,
        stack: err.stack,
      });

      this.sendError(
        res,
        'Failed to retrieve active agents',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getAgentsByChannelId = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { channelId } = req.params;
      logger.debug('Get agents by channel ID request received', { channelId });

      if (!channelId) {
        this.sendBadRequest(res, 'Channel ID is required');
        return;
      }

      const agents = await this.agentService.getAgentsByChannelId(channelId);

      logger.debug('Agents by channel ID retrieved successfully', {
        channelId,
        count: agents.length,
      });
      this.sendSuccess(
        res,
        agents,
        'Agents by channel ID retrieved successfully',
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get agents by channel ID:', {
        error: err.message,
        stack: err.stack,
        channelId: req.params.channelId,
      });

      this.sendError(
        res,
        'Failed to retrieve agents by channel ID',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getAgentsByProjectId = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { projectId } = req.params;
      logger.debug('Get agents by project ID request received', { projectId });

      if (!projectId) {
        this.sendBadRequest(res, 'Project ID is required');
        return;
      }

      const agents = await this.agentService.getAgentsByProjectId(projectId);

      logger.debug('Agents by project ID retrieved successfully', {
        projectId,
        count: agents.length,
      });
      this.sendSuccess(
        res,
        agents,
        'Agents by project ID retrieved successfully',
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get agents by project ID:', {
        error: err.message,
        stack: err.stack,
        projectId: req.params.projectId,
      });

      this.sendError(
        res,
        'Failed to retrieve agents by project ID',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getAgentsByUserId = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { userId } = req.params;
      logger.debug('Get agents by user ID request received', { userId });

      if (!userId) {
        this.sendBadRequest(res, 'User ID is required');
        return;
      }

      const agents = await this.agentService.getAgentsByUserId(userId);

      logger.debug('Agents by user ID retrieved successfully', {
        userId,
        count: agents.length,
      });
      this.sendSuccess(res, agents, 'Agents retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get agents by user ID:', {
        error: err.message,
        stack: err.stack,
        userId: req.params.userId,
      });

      this.sendError(
        res,
        'Failed to retrieve agents',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  async getAgentHierarchyInfo(
    req: ValidatedRequest<GetAgentHierarchyDto>,
    res: Response,
  ) {
    try {
      const { agentId, hierarchyId, channelId } = req.validatedQuery;

      logger.debug('Getting agent hierarchy info request', {
        agentId,
        hierarchyId,
        channelId,
      });

      const result = await this.agentService.getAgentHierarchyInfo(
        agentId,
        hierarchyId,
        channelId,
      );

      const message = result.hierarchies
        ? 'Successfully retrieved agent hierarchies'
        : 'Successfully retrieved agents list';

      this.sendSuccess(res, result, message);
    } catch (error) {
      const err = error as Error;
      this.sendError(
        res,
        'Failed to get agent hierarchy information',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  public bulkUploadAgents = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Bulk upload agents request received');

      // Check if file is uploaded
      if (!req.file) {
        this.sendBadRequest(res, 'Excel file is required');
        return;
      }

      // Get projectId from body
      const { projectId } = req.body;

      if (!projectId) {
        this.sendBadRequest(res, 'Project ID is required');
        return;
      }

      // Process the Excel file
      const result = await this.bulkAgentUploadService.processExcelFile(
        req.file.buffer,
        projectId as string,
      );

      const isSuccess = result.failureCount === 0;
      if (isSuccess) {
        this.sendSuccess(
          res,
          result,
          `Successfully processed ${result.successCount} agents`,
        );
      } else {
        this.sendBadRequest(
          res,
          `Failed to process ${result.failureCount} agents. Check errors for details.`,
        );
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to bulk upload agents:', {
        error: err.message,
        stack: err.stack,
      });

      this.sendError(
        res,
        'Failed to bulk upload agents',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public async bulkUpload(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, batchSize } = req.body;
      const fileBuffer = req.file?.buffer;

      if (!fileBuffer) {
        throw new BadRequestException('No file uploaded');
      }

      const result = await this.bulkAgentUploadService.processExcelFile(
        fileBuffer,
        projectId as string,
        batchSize as number,
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Bulk upload processed successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'An unknown error occurred',
        });
      }
    }
  }
}
