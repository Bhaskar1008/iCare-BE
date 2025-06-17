import type { Response } from 'express';
import { BaseController } from '@/controllers/base.controller';
import { AgentService } from '@/modules/agent/agent.service';
import type { ValidatedRequest } from '@/common/interfaces/validation.interface';
import type { GetAgentHierarchyDto } from '@/modules/agent/dto/get-agent-hierarchy.dto';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import logger from '@/common/utils/logger';

export class UtilityController extends BaseController {
  private agentService: AgentService;

  constructor() {
    super();
    this.agentService = new AgentService();
  }

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
}
