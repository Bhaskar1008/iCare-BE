import type { Request, Response } from 'express';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import { ValidationPipe } from '@/common/pipes/validation.pipe';
import { CreateModuleDto } from './dto/create-module.dto';
import { ModuleQueryDto } from './dto/module-query.dto';
import { ModuleResponseDto } from './dto/module-response.dto';
import type { IModuleController } from './interfaces/module.interface';
import { ModuleService } from './module.service';
import { plainToInstance } from 'class-transformer';

/**
 * @swagger
 * tags:
 *   name: Modules
 *   description: Module management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateModuleDto:
 *       type: object
 *       required:
 *         - name
 *         - code
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the module
 *         code:
 *           type: string
 *           description: Unique code for the module (uppercase letters, numbers, and underscores only)
 *         description:
 *           type: string
 *           description: Module description
 *         defaultConfig:
 *           type: object
 *           description: Default configuration for the module
 *         isActive:
 *           type: boolean
 *           description: Whether the module is active
 *         isCore:
 *           type: boolean
 *           description: Whether this is a core module
 *         version:
 *           type: string
 *           description: Module version
 *         dependencies:
 *           type: array
 *           items:
 *             type: string
 *           description: List of module dependencies
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           description: List of module permissions
 *     ModuleResponseDto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Module ID
 *         name:
 *           type: string
 *           description: Name of the module
 *         code:
 *           type: string
 *           description: Unique code for the module
 *         description:
 *           type: string
 *           description: Module description
 *         defaultConfig:
 *           type: object
 *           description: Default configuration for the module
 *         isActive:
 *           type: boolean
 *           description: Whether the module is active
 *         isCore:
 *           type: boolean
 *           description: Whether this is a core module
 *         version:
 *           type: string
 *           description: Module version
 *         dependencies:
 *           type: array
 *           items:
 *             type: string
 *           description: List of module dependencies
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           description: List of module permissions
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

export class ModuleController implements IModuleController {
  private readonly moduleService: ModuleService;

  constructor() {
    this.moduleService = new ModuleService();
  }

  /**
   * @swagger
   * /api/modules:
   *   post:
   *     summary: Create a new module
   *     tags: [Modules]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateModuleDto'
   *     responses:
   *       201:
   *         description: Module created successfully
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
   *                   example: Module created successfully
   *                 data:
   *                   $ref: '#/components/schemas/ModuleResponseDto'
   *       400:
   *         description: Bad request
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   */
  public createModule = async (req: Request, res: Response): Promise<void> => {
    try {
      await ValidationPipe.validateBody(CreateModuleDto)(req, res, () => {});
      const createModuleDto = plainToInstance(CreateModuleDto, req.body);
      const module = await this.moduleService.createModule(createModuleDto);
      const response = new ModuleResponseDto(module);

      res.status(HTTP_STATUS.CREATED).json({
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
   * /api/modules:
   *   get:
   *     summary: Get all modules with pagination and filters
   *     tags: [Modules]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: name
   *         schema:
   *           type: string
   *         description: Filter by module name
   *       - in: query
   *         name: code
   *         schema:
   *           type: string
   *         description: Filter by module code
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filter by active status
   *       - in: query
   *         name: isCore
   *         schema:
   *           type: boolean
   *         description: Filter by core module status
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 10
   *         description: Number of items per page
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           default: createdAt
   *         description: Field to sort by
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *         description: Sort order
   *     responses:
   *       200:
   *         description: List of modules
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     modules:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/ModuleResponseDto'
   *                     total:
   *                       type: integer
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   */
  public getModules = async (req: Request, res: Response): Promise<void> => {
    try {
      await ValidationPipe.validateQuery(ModuleQueryDto)(req, res, () => {});
      const { modules, total, page, limit } =
        await this.moduleService.getModules(req.query as ModuleQueryDto);

      const response = modules.map(module => new ModuleResponseDto(module));

      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: {
          modules: response,
          total,
          page,
          limit,
        },
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
   * /api/modules/{id}:
   *   get:
   *     summary: Get a module by ID
   *     tags: [Modules]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Module ID
   *     responses:
   *       200:
   *         description: Module details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/ModuleResponseDto'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       404:
   *         description: Module not found
   */
  public getModuleById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const module = await this.moduleService.getModuleById(id);
      const response = new ModuleResponseDto(module);

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
   * /api/modules/{id}:
   *   put:
   *     summary: Update a module
   *     tags: [Modules]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Module ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateModuleDto'
   *     responses:
   *       200:
   *         description: Module updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/ModuleResponseDto'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       404:
   *         description: Module not found
   */
  public updateModule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await ValidationPipe.validateBody(CreateModuleDto)(req, res, () => {});
      const updateModuleDto = plainToInstance(CreateModuleDto, req.body, {
        excludeExtraneousValues: true,
      });
      const module = await this.moduleService.updateModule(id, updateModuleDto);
      const response = new ModuleResponseDto(module);

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
   * /api/modules/{id}:
   *   delete:
   *     summary: Delete a module
   *     tags: [Modules]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Module ID
   *     responses:
   *       200:
   *         description: Module deleted successfully
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
   *                   example: Module deleted successfully
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       404:
   *         description: Module not found
   */
  public deleteModule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.moduleService.deleteModule(id);

      res.status(HTTP_STATUS.OK).send();
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
