import type { Request, Response } from 'express';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import { ValidationPipe } from '@/common/pipes/validation.pipe';
import { CreateAccessControlDto } from './dto/create-access-control.dto';
import { AccessControlResponseDto } from './dto/access-control-response.dto';
import type { IAccessControlController } from './interfaces/access-control.interface';
import { AccessControlService } from './access-control.service';
import { plainToInstance } from 'class-transformer';

/**
 * @swagger
 * tags:
 *   name: Access Control
 *   description: Module access control management based on roles
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RoleAssignment:
 *       type: object
 *       required:
 *         - roleId
 *         - status
 *       properties:
 *         roleId:
 *           type: string
 *           description: ID of the role from roles collection
 *         status:
 *           type: boolean
 *           description: Whether the module is visible for this role
 *     ModuleConfig:
 *       type: object
 *       required:
 *         - moduleId
 *         - rolesAssigned
 *       properties:
 *         moduleId:
 *           type: string
 *           description: ID of the module from modules collection
 *         rolesAssigned:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RoleAssignment'
 *           description: Array of role-based visibility settings
 *     CreateAccessControlDto:
 *       type: object
 *       required:
 *         - projectId
 *         - channelId
 *         - moduleConfigs
 *       properties:
 *         projectId:
 *           type: string
 *           description: ID of the project
 *         channelId:
 *           type: string
 *           description: ID of the channel
 *         moduleConfigs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ModuleConfig'
 *           description: Array of module configurations with role-based settings
 *     AccessControlResponseDto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Access control configuration ID
 *         projectId:
 *           type: string
 *           description: Project ID
 *         channelId:
 *           type: string
 *           description: Channel ID
 *         moduleConfigs:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               moduleId:
 *                 type: string
 *                 description: Module ID
 *               moduleName:
 *                 type: string
 *                 description: Module name (populated from module)
 *               moduleCode:
 *                 type: string
 *                 description: Module code (populated from module)
 *               rolesAssigned:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/RoleAssignment'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export class AccessControlController implements IAccessControlController {
  private readonly accessControlService: AccessControlService;

  constructor() {
    this.accessControlService = new AccessControlService();
  }

  /**
   * @swagger
   * /api/access-controls/project/{projectId}/channel/{channelId}:
   *   get:
   *     summary: Get access control configuration by project and channel
   *     description: |
   *       Fetches access control configuration for a specific project and channel.
   *       If configuration exists, returns it with populated module and role details.
   *       If not, returns default configuration with all roles set to false.
   *     tags: [Access Control]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: projectId
   *         required: true
   *         schema:
   *           type: string
   *         description: Project ID to get configuration for
   *       - in: path
   *         name: channelId
   *         required: true
   *         schema:
   *           type: string
   *         description: Channel ID to get configuration for
   *     responses:
   *       200:
   *         description: Access control configuration with module and role details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   $ref: '#/components/schemas/AccessControlResponseDto'
   *       400:
   *         description: Bad request
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       404:
   *         description: Project or channel not found
   */
  public getAccessControlsByProjectAndChannel = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { projectId, channelId } = req.params;
      const accessControl =
        await this.accessControlService.getOrCreateDefaultAccessControl(
          projectId,
          channelId,
        );
      const response = new AccessControlResponseDto(accessControl);

      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: response,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: error.message,
        });
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          status: 'error',
          message: 'Internal server error',
        });
      }
    }
  };

  /**
   * @swagger
   * /api/access-controls/project/{projectId}/channel/{channelId}/createOrUpdate:
   *   post:
   *     summary: Create or update access control configuration
   *     description: |
   *       Creates a new access control configuration if none exists,
   *       or updates existing configuration for the given project and channel.
   *     tags: [Access Control]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateAccessControlDto'
   *           example:
   *             projectId: "project123"
   *             channelId: "channel456"
   *             moduleConfigs:
   *               - moduleId: "module123"
   *                 rolesAssigned:
   *                   - roleId: "role123"
   *                     status: true
   *                   - roleId: "role456"
   *                     status: false
   *     responses:
   *       200:
   *         description: Access control configuration created/updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   $ref: '#/components/schemas/AccessControlResponseDto'
   *       400:
   *         description: Bad request - Invalid input
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       404:
   *         description: Project, channel, module, or role not found
   */
  public createOrUpdateAccessControl = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      await ValidationPipe.validateBody(CreateAccessControlDto)(
        req,
        res,
        () => {},
      );
      const createAccessControlDto = plainToInstance(
        CreateAccessControlDto,
        req.body,
      );
      const { projectId, channelId, moduleConfigs } = createAccessControlDto;

      const accessControl =
        await this.accessControlService.createOrUpdateAccessControl(
          projectId,
          channelId,
          moduleConfigs,
        );
      const response = new AccessControlResponseDto(accessControl);

      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: response,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: error.message,
        });
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          status: 'error',
          message: 'Internal server error',
        });
      }
    }
  };
}
