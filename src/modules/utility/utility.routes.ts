import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import type { ValidatedRequest } from '@/common/interfaces/validation.interface';
import { ValidationPipe } from '@/common/pipes/validation.pipe';
import { GetAgentHierarchyDto } from '@/modules/agent/dto/get-agent-hierarchy.dto';
import { UtilityController } from './utility.controller';

const router = Router();
const utilityController = new UtilityController();

/**
 * @swagger
 * /api/utility/hierarchy:
 *   get:
 *     summary: Get agent hierarchy information
 *     description: Retrieves hierarchy information and agents based on the provided agent ID, hierarchy ID, and channel ID
 *     tags: [Utility]
 *     parameters:
 *       - in: query
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the agent
 *       - in: query
 *         name: hierarchyId
 *         required: false
 *         schema:
 *           type: string
 *         description: The ID of the hierarchy
 *       - in: query
 *         name: channelId
 *         required: false
 *         schema:
 *           type: string
 *         description: The ID of the channel
 *     responses:
 *       200:
 *         description: Successfully retrieved agent hierarchy information
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Internal server error
 */
router.get(
  '/hierarchy',
  ValidationPipe.validateQuery(GetAgentHierarchyDto),
  (req: Request, res: Response, next: NextFunction) =>
    utilityController
      .getAgentHierarchyInfo(req as ValidatedRequest<GetAgentHierarchyDto>, res)
      .catch(next),
);

export default router;
