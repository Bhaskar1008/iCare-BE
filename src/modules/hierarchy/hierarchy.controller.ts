import type { Request, Response } from 'express';
import { BaseController } from '@/controllers/base.controller';
import { HierarchyService } from '@/modules/hierarchy/hierarchy.service';
import logger from '@/common/utils/logger';
import mongoose from 'mongoose';
import type {
  CreateHierarchyDto,
  UpdateHierarchyDto,
  HierarchyQueryDto,
  HierarchyResponseDto,
} from '@/modules/hierarchy/dto';
import type {
  IHierarchyController,
  IHierarchyService,
  HierarchyListResponseDto,
} from '@/modules/hierarchy/interfaces/hierarchy.interface';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';
import type { ValidatedRequest } from '@/common/interfaces/validation.interface';
import {
  HIERARCHY,
  PAGINATION,
  HTTP_STATUS,
} from '@/common/constants/http-status.constants';

interface ErrorWithMessage {
  message: string;
  stack?: string;
}

export class HierarchyController
  extends BaseController
  implements IHierarchyController
{
  private hierarchyService: IHierarchyService;

  constructor() {
    super();
    this.hierarchyService = new HierarchyService();
  }

  public createHierarchy = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Creating hierarchy request received', {
        body: req.body as unknown,
      });

      // req.body is now validated and transformed by ValidationPipe
      const hierarchyData = req.body as CreateHierarchyDto;
      const hierarchy: HierarchyResponseDto =
        await this.hierarchyService.createHierarchy(hierarchyData);

      logger.info('Hierarchy created successfully', { id: hierarchy._id });
      this.sendCreated(res, hierarchy, 'Hierarchy created successfully');
    } catch (error) {
      this.handleServiceError(error, res, req.body);
    }
  };

  private handleServiceError(
    error: unknown,
    res: Response,
    requestData?: unknown,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Service operation failed:', {
      error: err.message,
      stack: err.stack,
      requestData,
    });

    if (error instanceof DatabaseValidationException) {
      this.sendBadRequest(res, err.message, err);
    } else {
      this.sendError(
        res,
        'Service operation failed',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  }

  public getHierarchyById = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Getting hierarchy by ID request received', { id });

      if (!id) {
        this.sendBadRequest(res, 'Hierarchy ID is required');
        return;
      }

      const hierarchy: HierarchyResponseDto | null =
        await this.hierarchyService.getHierarchyById(id);

      if (!hierarchy) {
        this.sendNotFound(res, 'Hierarchy not found');
        return;
      }

      logger.debug('Hierarchy retrieved successfully', { id });
      this.sendSuccess(res, hierarchy, 'Hierarchy retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get hierarchy by ID:', {
        error: err.message,
        stack: err.stack,
        id: req.params.id,
      });
      this.sendError(
        res,
        'Failed to retrieve hierarchy',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getHierarchiesByChannel = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { channelId } = req.params;
      logger.debug('Getting hierarchies by channel request received', {
        channelId,
      });

      if (!channelId) {
        this.sendBadRequest(res, 'Channel ID is required');
        return;
      }

      const hierarchies: HierarchyResponseDto[] =
        await this.hierarchyService.getHierarchiesByChannel(channelId);
      logger.debug('Hierarchies retrieved by channel successfully', {
        channelId,
        count: hierarchies.length,
      });

      this.sendSuccess(res, hierarchies, 'Hierarchies retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get hierarchies by channel:', {
        error: err.message,
        stack: err.stack,
        channelId: req.params.channelId,
      });
      this.sendError(
        res,
        'Failed to retrieve hierarchies',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  private validateChannelAndLevel(
    channelId: string | undefined,
    level: string | undefined,
    res: Response,
  ): { isValid: boolean; levelNum?: number } {
    if (!channelId) {
      this.sendBadRequest(res, 'Channel ID is required');
      return { isValid: false };
    }

    if (!level) {
      this.sendBadRequest(res, 'Level is required');
      return { isValid: false };
    }

    const levelNum = parseInt(level);
    if (isNaN(levelNum) || levelNum < HIERARCHY.MIN_LEVEL) {
      this.sendBadRequest(res, `Level must be at least ${HIERARCHY.MIN_LEVEL}`);
      return { isValid: false };
    }

    return { isValid: true, levelNum };
  }

  public getHierarchiesByChannelAndLevel = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { channelId } = req.params;
      const { level } = req.query;
      logger.debug(
        'Getting hierarchies by channel and level request received',
        { channelId, level },
      );

      const validation = this.validateChannelAndLevel(
        channelId,
        level as string,
        res,
      );
      if (!validation.isValid) {
        return;
      }

      const hierarchies: HierarchyResponseDto[] =
        await this.hierarchyService.getHierarchiesByChannelAndLevel(
          channelId,
          validation.levelNum!,
        );

      logger.debug('Hierarchies retrieved by channel and level successfully', {
        channelId,
        level: validation.levelNum,
        count: hierarchies.length,
      });

      this.sendSuccess(res, hierarchies, 'Hierarchies retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get hierarchies by channel and level:', {
        error: err.message,
        stack: err.stack,
        channelId: req.params.channelId,
        level: req.query.level,
      });
      this.sendError(
        res,
        'Failed to retrieve hierarchies',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getRootHierarchies = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { channelId } = req.params;
      logger.debug('Getting root hierarchies request received', { channelId });

      if (!channelId) {
        this.sendBadRequest(res, 'Channel ID is required');
        return;
      }

      const hierarchies: HierarchyResponseDto[] =
        await this.hierarchyService.getRootHierarchies(channelId);
      logger.debug('Root hierarchies retrieved successfully', {
        channelId,
        count: hierarchies.length,
      });

      this.sendSuccess(
        res,
        hierarchies,
        'Root hierarchies retrieved successfully',
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get root hierarchies:', {
        error: err.message,
        stack: err.stack,
        channelId: req.params.channelId,
      });
      this.sendError(
        res,
        'Failed to retrieve root hierarchies',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getChildHierarchies = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { parentId } = req.params;
      logger.debug('Getting child hierarchies request received', { parentId });

      if (!parentId) {
        this.sendBadRequest(res, 'Parent ID is required');
        return;
      }

      const hierarchies: HierarchyResponseDto[] =
        await this.hierarchyService.getChildHierarchies(parentId);
      logger.debug('Child hierarchies retrieved successfully', {
        parentId,
        count: hierarchies.length,
      });

      this.sendSuccess(
        res,
        hierarchies,
        'Child hierarchies retrieved successfully',
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get child hierarchies:', {
        error: err.message,
        stack: err.stack,
        parentId: req.params.parentId,
      });
      this.sendError(
        res,
        'Failed to retrieve child hierarchies',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getAllHierarchies = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Getting all hierarchies request received', {
        query: req.query,
      });

      const queryParams = (req as ValidatedRequest<HierarchyQueryDto>)
        .validatedQuery;
      const result: HierarchyListResponseDto =
        await this.hierarchyService.getAllHierarchies(
          queryParams.page ?? PAGINATION.DEFAULT_PAGE,
          queryParams.limit ?? PAGINATION.DEFAULT_LIMIT,
          queryParams.channelId,
          queryParams.hierarchyLevel,
          queryParams.hierarchyStatus,
        );

      logger.debug('All hierarchies retrieved successfully', {
        count: result.hierarchies.length,
        total: result.pagination.total,
        page: queryParams.page,
        limit: queryParams.limit,
      });

      this.sendSuccess(res, result, 'Hierarchies retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get all hierarchies:', {
        error: err.message,
        stack: err.stack,
        query: req.query,
      });
      this.sendError(
        res,
        'Failed to retrieve hierarchies',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getHierarchyTeamMemberList = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { teamMembers } = req.query;
      const currentUserHeader = req.headers.currentuser as string;

      this.logHierarchyTeamMemberRequest(teamMembers, currentUserHeader, req);

      if (!currentUserHeader) {
        this.sendBadRequest(res, 'Current user information is required');
        return;
      }

      const { channelId, userId } =
        this.extractCurrentUserData(currentUserHeader);

      if (!channelId || !userId) {
        this.sendBadRequest(res, 'Channel ID and User ID are required');
        return;
      }

      const result = await this.hierarchyService.getHierarchyTeamMemberList(
        channelId,
        userId,
        teamMembers === 'true',
      );

      this.logServiceResult(result);
      this.sendSuccess(res, result, 'Data retrieved successfully');
    } catch (error) {
      this.handleHierarchyTeamMemberError(error, res);
    }
  };

  private logHierarchyTeamMemberRequest(
    teamMembers: unknown,
    currentUserHeader: string,
    req: Request,
  ): void {
    logger.debug('HierarchyTeamMemberList request received', {
      teamMembers,
      hasCurrentUserHeader: !!currentUserHeader,
      authHeader: req.headers.authorization
        ? 'Bearer token present'
        : 'No auth header',
    });
  }

  private extractCurrentUserData(currentUserHeader: string): {
    channelId: string;
    userId: string;
  } {
    const currentUser = JSON.parse(currentUserHeader);
    const { channelId, id: userId } = currentUser;

    logger.debug('Current user data extracted', {
      currentUser,
      channelId,
      userId,
    });

    return {
      channelId: String(channelId ?? ''),
      userId: String(userId ?? ''),
    };
  }

  private logServiceResult(result: unknown): void {
    logger.debug('Service result', {
      resultCount: Array.isArray(result) ? result.length : 'Not an array',
      resultType: typeof result,
    });
  }

  private handleHierarchyTeamMemberError(error: unknown, res: Response): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get hierarchy team member list:', {
      error: err.message,
      stack: err.stack,
    });
    this.sendError(
      res,
      'Failed to retrieve data',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }

  public updateHierarchy = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Updating hierarchy request received', {
        id,
        body: req.body as unknown,
      });

      if (!id) {
        this.sendBadRequest(res, 'Hierarchy ID is required');
        return;
      }

      // req.body is now validated and transformed by ValidationPipe
      const updateData = req.body as UpdateHierarchyDto;
      if (Object.keys(updateData).length === 0) {
        this.sendBadRequest(res, 'At least one field is required for update');
        return;
      }

      const hierarchy: HierarchyResponseDto | null =
        await this.hierarchyService.updateHierarchy(id, updateData);
      if (!hierarchy) {
        this.sendNotFound(res, 'Hierarchy not found');
        return;
      }

      logger.info('Hierarchy updated successfully', { id });
      this.sendSuccess(res, hierarchy, 'Hierarchy updated successfully');
    } catch (error) {
      this.handleServiceError(error, res, {
        id: req.params.id,
        body: req.body as unknown,
      });
    }
  };

  public deleteHierarchy = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Deleting hierarchy request received', { id });

      if (!id) {
        this.sendBadRequest(res, 'Hierarchy ID is required');
        return;
      }

      const deleted: boolean = await this.hierarchyService.deleteHierarchy(id);

      if (!deleted) {
        this.sendNotFound(res, 'Hierarchy not found');
        return;
      }

      logger.info('Hierarchy deleted successfully', { id });
      this.sendSuccess(
        res,
        { deleted: true },
        'Hierarchy deleted successfully',
      );
    } catch (error) {
      this.handleServiceError(error, res, { id: req.params.id });
    }
  };

  private formatError(error: unknown): ErrorWithMessage {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
      };
    }
    return {
      message: String(error),
    };
  }

  public getHierarchyByAgentId = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { agentId } = req.params;

      if (!agentId) {
        this.sendBadRequest(res, 'Agent ID is required');
        return;
      }

      // Validate MongoDB ObjectId format
      if (!mongoose.Types.ObjectId.isValid(agentId)) {
        this.sendBadRequest(res, 'Invalid agent ID format');
        return;
      }

      try {
        const result =
          await this.hierarchyService.getHierarchyByAgentId(agentId);
        this.sendSuccess(
          res,
          result,
          'Hierarchy information retrieved successfully',
        );
      } catch (error) {
        if (error instanceof Error) {
          switch (error.message) {
            case 'Agent not found':
              this.sendNotFound(res, error.message);
              break;
            case 'Agent is not active':
            case 'Designation not found':
            case 'Hierarchy not found':
              this.sendNotFound(res, error.message);
              break;
            default:
              throw error;
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      logger.error(
        'Failed to get hierarchy by agent ID:',
        this.formatError(error),
      );
      this.sendError(
        res,
        'Failed to retrieve hierarchy information',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        this.formatError(error),
      );
    }
  };

  public getAgentsByHierarchyDesignation = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { channelId } = req.params;
      const { designationName } = req.query;

      if (!channelId) {
        this.sendBadRequest(res, 'Channel ID is required');
        return;
      }

      if (!designationName || typeof designationName !== 'string') {
        this.sendBadRequest(res, 'Designation name is required');
        return;
      }

      // Validate MongoDB ObjectId format
      if (!mongoose.Types.ObjectId.isValid(channelId)) {
        this.sendBadRequest(res, 'Invalid channel ID format');
        return;
      }

      try {
        const result =
          await this.hierarchyService.getAgentsByHierarchyDesignation(
            channelId,
            designationName,
          );
        this.sendSuccess(res, result, 'Agents retrieved successfully');
      } catch (error) {
        if (error instanceof Error) {
          switch (error.message) {
            case 'Channel ID is required':
            case 'Designation name is required':
            case 'Invalid channel ID':
              this.sendBadRequest(res, error.message);
              break;
            case 'Designation not found':
              this.sendNotFound(res, error.message);
              break;
            default:
              throw error;
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      logger.error(
        'Failed to get agents by hierarchy designation:',
        this.formatError(error),
      );
      this.sendError(
        res,
        'Failed to retrieve agents',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        this.formatError(error),
      );
    }
  };
}
