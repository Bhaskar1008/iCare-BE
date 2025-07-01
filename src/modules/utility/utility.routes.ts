import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import type { ValidatedRequest } from '@/common/interfaces/validation.interface';
import { ValidationPipe } from '@/common/pipes/validation.pipe';
import { GetAgentHierarchyDto } from '@/modules/agent/dto/get-agent-hierarchy.dto';
import { GetAgentHierarchyInfoDto } from '@/modules/agent/dto/get-agent-hierarchy-info.dto';
import { UtilityController } from './utility.controller';
import { EmailVerificationDto } from './dto/email-verification.dto';

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

/**
 * @swagger
 * /api/utility/hierarchy-with-agents:
 *   get:
 *     summary: Get agent hierarchy information with all active agents grouped by hierarchy
 *     description: Retrieves hierarchy information with their associated active agents. Only includes hierarchies that have at least one active agent.
 *     tags: [Utility]
 *     parameters:
 *       - in: query
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the agent
 *       - in: query
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the channel
 *     responses:
 *       200:
 *         description: Successfully retrieved agent hierarchy information with agents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Successfully retrieved agent hierarchy with agents
 *                 data:
 *                   type: object
 *                   properties:
 *                     hierarchies:
 *                       type: array
 *                       description: List of hierarchies that have at least one active agent
 *                       items:
 *                         type: object
 *                         properties:
 *                           hierarchyName:
 *                             type: string
 *                             example: Business Development Manager
 *                           hierarchyId:
 *                             type: string
 *                             example: 507f1f77bcf86cd799439011
 *                           agents:
 *                             type: array
 *                             description: List of active agents under this hierarchy
 *                             items:
 *                               type: object
 *                               properties:
 *                                 firstName:
 *                                   type: string
 *                                   example: John
 *                                 lastName:
 *                                   type: string
 *                                   example: Doe
 *                                 id:
 *                                   type: string
 *                                   example: 507f1f77bcf86cd799439011
 *                                 agentCode:
 *                                   type: string
 *                                   example: AGT001
 *                                 designationName:
 *                                   type: string
 *                                   example: Regional Manager
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Internal server error
 */
router.get(
  '/hierarchy-with-agents',
  ValidationPipe.validateQuery(GetAgentHierarchyInfoDto),
  (req: Request, res: Response, next: NextFunction) =>
    utilityController
      .getAgentHierarchyWithAgents(
        req as ValidatedRequest<GetAgentHierarchyInfoDto>,
        res,
      )
      .catch(next),
);

/**
 * @swagger
 * /api/utility/email-verification:
 *   post:
 *     summary: Verify email address and optionally send/verify OTP
 *     description: |
 *       This endpoint serves two purposes:
 *       1. Validates if an email is already registered in the system
 *       2. Sends an OTP to the email if it's not registered
 *       3. Verifies the OTP if one is provided in the request
 *     tags: [Utility]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailId
 *             properties:
 *               emailId:
 *                 type: string
 *                 format: email
 *                 description: Email address to verify
 *                 example: "john.doe@example.com"
 *               otp:
 *                 type: string
 *                 description: OTP code to verify (optional)
 *                 example: "3003"
 *     responses:
 *       200:
 *         description: Email verification response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP sent to john.doe@example.com"
 *                 data:
 *                   type: object
 *                   properties:
 *                     exists:
 *                       type: boolean
 *                       description: Whether the email is already registered
 *                       example: false
 *                     otpSent:
 *                       type: boolean
 *                       description: Whether an OTP was sent (only if email doesn't exist)
 *                       example: true
 *                     verified:
 *                       type: boolean
 *                       description: Whether the OTP was verified successfully (only if OTP was provided)
 *                       example: true
 *       400:
 *         description: Bad request - invalid email format or OTP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Valid email address is required"
 *       500:
 *         description: Internal server error
 */
router.post(
  '/email-verification',
  ValidationPipe.validateBody(EmailVerificationDto),
  (req: Request, res: Response, next: NextFunction) =>
    utilityController.verifyEmail(req, res).catch(next),
);

export default router;
