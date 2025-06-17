import type { Request, Response } from 'express';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import { ValidationPipe } from '@/common/pipes/validation.pipe';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import type { IProjectController } from './interfaces/project.interface';
import { ProjectService } from './project.service';
import { plainToInstance } from 'class-transformer';

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ModuleConfig:
 *       type: object
 *       required:
 *         - moduleId
 *       properties:
 *         moduleId:
 *           type: string
 *           description: ID of the module from the modules collection
 *         isActive:
 *           type: boolean
 *           description: Whether the module is active in this project
 *         config:
 *           type: object
 *           description: Project-specific configuration for this module
 *     Module:
 *       type: object
 *       required:
 *         - name
 *         - code
 *         - version
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
 *           description: Whether the module is active globally
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
 *     CreateProjectDto:
 *       type: object
 *       required:
 *         - projectName
 *         - projectCode
 *         - modules
 *       properties:
 *         projectName:
 *           type: string
 *           description: Name of the project
 *         projectCode:
 *           type: string
 *           description: Unique code for the project
 *         description:
 *           type: string
 *           description: Project description
 *         modules:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ModuleConfig'
 *           description: Array of module configurations
 *         projectStatus:
 *           type: string
 *           enum: [active, inactive]
 *           description: Status of the project
 *     ProjectResponseDto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Project ID
 *         projectName:
 *           type: string
 *           description: Name of the project
 *         projectCode:
 *           type: string
 *           description: Unique code for the project
 *         description:
 *           type: string
 *           description: Project description
 *         modules:
 *           type: array
 *           items:
 *             allOf:
 *               - $ref: '#/components/schemas/ModuleConfig'
 *               - type: object
 *                 properties:
 *                   moduleDetails:
 *                     $ref: '#/components/schemas/Module'
 *           description: Array of module configurations with module details
 *         projectStatus:
 *           type: string
 *           enum: [active, inactive]
 *           description: Status of the project
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

export class ProjectController implements IProjectController {
  private readonly projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService();
  }

  /**
   * @swagger
   * /api/projects:
   *   post:
   *     summary: Create a new project
   *     tags: [Projects]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateProjectDto'
   *     responses:
   *       201:
   *         description: Project created successfully
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
   *                   example: Project created successfully
   *                 data:
   *                   $ref: '#/components/schemas/ProjectResponseDto'
   *       400:
   *         description: Bad request
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   */
  public createProject = async (req: Request, res: Response): Promise<void> => {
    try {
      await ValidationPipe.validateBody(CreateProjectDto)(req, res, () => {});
      const createProjectDto = plainToInstance(CreateProjectDto, req.body);
      const project = await this.projectService.createProject(createProjectDto);
      const response = new ProjectResponseDto(project);

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
   * /api/projects:
   *   get:
   *     summary: Get all projects with pagination and filters
   *     tags: [Projects]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: projectName
   *         schema:
   *           type: string
   *         description: Filter by project name
   *       - in: query
   *         name: projectCode
   *         schema:
   *           type: string
   *         description: Filter by project code
   *       - in: query
   *         name: projectStatus
   *         schema:
   *           type: string
   *           enum: [active, inactive]
   *         description: Filter by project status
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
   *         description: List of projects
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
   *                     projects:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/ProjectResponseDto'
   *                     total:
   *                       type: integer
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   */
  public getProjects = async (req: Request, res: Response): Promise<void> => {
    try {
      await ValidationPipe.validateQuery(ProjectQueryDto)(req, res, () => {});
      const { projects, total, page, limit } =
        await this.projectService.getProjects(req.query as ProjectQueryDto);

      const response = projects.map(project => new ProjectResponseDto(project));

      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: {
          projects: response,
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
   * /api/projects/{id}:
   *   get:
   *     summary: Get a project by ID
   *     tags: [Projects]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Project ID
   *     responses:
   *       200:
   *         description: Project details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/ProjectResponseDto'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       404:
   *         description: Project not found
   */
  public getProjectById = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const project = await this.projectService.getProjectById(id);
      const response = new ProjectResponseDto(project);

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
   * /api/projects/{id}:
   *   put:
   *     summary: Update a project
   *     tags: [Projects]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Project ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateProjectDto'
   *     responses:
   *       200:
   *         description: Project updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/ProjectResponseDto'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       404:
   *         description: Project not found
   */
  public updateProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await ValidationPipe.validateBody(CreateProjectDto)(req, res, () => {});
      const updateProjectDto = plainToInstance(CreateProjectDto, req.body, {
        excludeExtraneousValues: true,
      });
      const project = await this.projectService.updateProject(
        id,
        updateProjectDto,
      );
      const response = new ProjectResponseDto(project);

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
   * /api/projects/{id}:
   *   delete:
   *     summary: Delete a project
   *     tags: [Projects]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Project ID
   *     responses:
   *       200:
   *         description: Project deleted successfully
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
   *                   example: Project deleted successfully
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       404:
   *         description: Project not found
   */
  public deleteProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.projectService.deleteProject(id);

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
