import { Router } from 'express';
import { ModuleConfigController } from './module-config.controller';
import { ValidationPipe } from '@/common/pipes/validation.pipe';
import { CreateModuleConfigDto } from './dto/create-module-config.dto';
import { UpdateModuleConfigDto } from './dto/update-module-config.dto';
import { ModuleConfigQueryDto } from './dto/module-config-query.dto';
import { authenticateJwt } from '@/middleware/auth.middleware';

const router = Router();
const moduleConfigController = new ModuleConfigController();

/**
 * @swagger
 * components:
 *   schemas:
 *     ConfigValue:
 *       type: object
 *       required:
 *         - key
 *         - value
 *       properties:
 *         key:
 *           type: string
 *           description: Unique identifier for the config value
 *           example: "meeting"
 *         value:
 *           type: string
 *           description: The actual value
 *           example: "Meeting"
 *         displayName:
 *           type: string
 *           description: Display name for the UI
 *           example: "Meeting"
 *         dependentValues:
 *           type: array
 *           items:
 *             type: string
 *           description: List of dependent values for cascading dropdowns
 *           example: ["internal", "external"]
 *
 *     ConfigField:
 *       type: object
 *       required:
 *         - fieldName
 *         - fieldType
 *         - values
 *       properties:
 *         fieldName:
 *           type: string
 *           description: Name of the configuration field
 *           example: "eventWith"
 *         fieldType:
 *           type: string
 *           description: Type of the field (dropdown, text, etc.)
 *           example: "dropdown"
 *         description:
 *           type: string
 *           description: Description of the field
 *           example: "Event With options for Activity Tracker"
 *         values:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ConfigValue'
 *
 *     CreateModuleConfigRequest:
 *       type: object
 *       required:
 *         - moduleId
 *         - configName
 *         - fields
 *       properties:
 *         moduleId:
 *           type: string
 *           description: ID of the module this configuration belongs to
 *           example: "507f1f77bcf86cd799439011"
 *         projectId:
 *           type: string
 *           description: ID of the project this configuration belongs to (optional)
 *           example: "507f1f77bcf86cd799439022"
 *         configName:
 *           type: string
 *           description: Name of the configuration
 *           example: "activityTrackerConfig"
 *         description:
 *           type: string
 *           description: Description of the configuration
 *           example: "Configuration for Activity Tracker module"
 *         fields:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ConfigField'
 *         metadata:
 *           type: object
 *           description: Additional metadata for the configuration
 *           example: { "version": "1.0" }
 *
 *     UpdateModuleConfigRequest:
 *       type: object
 *       properties:
 *         configName:
 *           type: string
 *           description: Name of the configuration
 *           example: "activityTrackerConfig"
 *         description:
 *           type: string
 *           description: Description of the configuration
 *           example: "Updated configuration for Activity Tracker module"
 *         fields:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ConfigField'
 *         metadata:
 *           type: object
 *           description: Additional metadata for the configuration
 *           example: { "version": "1.1" }
 *
 *     ModuleConfigResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the configuration
 *           example: "507f1f77bcf86cd799439011"
 *         moduleId:
 *           type: string
 *           description: ID of the module this configuration belongs to
 *           example: "507f1f77bcf86cd799439012"
 *         moduleName:
 *           type: string
 *           description: Name of the module (populated)
 *           example: "Activity Tracker"
 *         projectId:
 *           type: string
 *           description: ID of the project this configuration belongs to (if applicable)
 *           example: "507f1f77bcf86cd799439022"
 *         projectName:
 *           type: string
 *           description: Name of the project (populated, if applicable)
 *           example: "Sales Project"
 *         configName:
 *           type: string
 *           description: Name of the configuration
 *           example: "activityTrackerConfig"
 *         description:
 *           type: string
 *           description: Description of the configuration
 *           example: "Configuration for Activity Tracker module"
 *         fields:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ConfigField'
 *         metadata:
 *           type: object
 *           description: Additional metadata for the configuration
 *           example: { "version": "1.0" }
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 */

/**
 * @swagger
 * tags:
 *   name: Module Configurations
 *   description: Module configuration management endpoints
 */

/**
 * @swagger
 * /api/module-configs:
 *   post:
 *     tags: [Module Configurations]
 *     summary: Create a new module configuration
 *     description: Creates a new configuration for a module with fields and values
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateModuleConfigRequest'
 *     responses:
 *       201:
 *         description: Module configuration created successfully
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
 *                   example: "Module configuration created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ModuleConfigResponse'
 *       400:
 *         description: Bad request - validation errors
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  authenticateJwt,
  ValidationPipe.validateBody(CreateModuleConfigDto),
  moduleConfigController.createModuleConfig,
);

/**
 * @swagger
 * /api/module-configs:
 *   get:
 *     tags: [Module Configurations]
 *     summary: Get all module configurations
 *     description: Retrieves all module configurations with optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: moduleId
 *         schema:
 *           type: string
 *         description: Filter by module ID
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: configName
 *         schema:
 *           type: string
 *         description: Filter by configuration name (partial match)
 *     responses:
 *       200:
 *         description: Module configurations retrieved successfully
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
 *                   example: "Module configurations retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ModuleConfigResponse'
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  authenticateJwt,
  ValidationPipe.validateQuery(ModuleConfigQueryDto),
  moduleConfigController.getAllModuleConfigs,
);

/**
 * @swagger
 * /api/module-configs/module/{moduleId}:
 *   get:
 *     tags: [Module Configurations]
 *     summary: Get configurations by module ID
 *     description: Retrieves all configurations for a specific module
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
 *     responses:
 *       200:
 *         description: Module configurations retrieved successfully
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
 *                   example: "Module configurations retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ModuleConfigResponse'
 *       400:
 *         description: Bad request - invalid module ID
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Internal server error
 */
router.get(
  '/module/:moduleId',
  authenticateJwt,
  moduleConfigController.getModuleConfigsByModuleId,
);

/**
 * @swagger
 * /api/module-configs/project/{projectId}:
 *   get:
 *     tags: [Module Configurations]
 *     summary: Get configurations by project ID
 *     description: Retrieves all configurations for a specific project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Module configurations retrieved successfully
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
 *                   example: "Module configurations retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ModuleConfigResponse'
 *       400:
 *         description: Bad request - invalid project ID
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Internal server error
 */
router.get(
  '/project/:projectId',
  authenticateJwt,
  moduleConfigController.getModuleConfigsByProjectId,
);

/**
 * @swagger
 * /api/module-configs/module/{moduleId}/project:
 *   get:
 *     tags: [Module Configurations]
 *     summary: Get configurations by module ID and optional project ID
 *     description: Retrieves configurations for a specific module, optionally filtered by project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Optional project ID to filter by
 *     responses:
 *       200:
 *         description: Module configurations retrieved successfully
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
 *                   example: "Module configurations retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ModuleConfigResponse'
 *       400:
 *         description: Bad request - invalid module ID
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Internal server error
 */
router.get(
  '/module/:moduleId/project',
  authenticateJwt,
  moduleConfigController.getModuleConfigsByModuleIdAndProjectId,
);

/**
 * @swagger
 * /api/module-configs/module/{moduleId}/config/{configName}:
 *   get:
 *     tags: [Module Configurations]
 *     summary: Get configuration by module ID and name
 *     description: Retrieves a specific configuration for a module by its name, optionally filtered by project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
 *       - in: path
 *         name: configName
 *         required: true
 *         schema:
 *           type: string
 *         description: Configuration name
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Optional project ID to filter by
 *     responses:
 *       200:
 *         description: Module configuration retrieved successfully
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
 *                   example: "Module configuration retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ModuleConfigResponse'
 *       400:
 *         description: Bad request - invalid parameters
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Module configuration not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/module/:moduleId/config/:configName',
  authenticateJwt,
  moduleConfigController.getModuleConfigByModuleIdAndName,
);

/**
 * @swagger
 * /api/module-configs/{id}:
 *   get:
 *     tags: [Module Configurations]
 *     summary: Get configuration by ID
 *     description: Retrieves a specific module configuration by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Configuration ID
 *     responses:
 *       200:
 *         description: Module configuration retrieved successfully
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
 *                   example: "Module configuration retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ModuleConfigResponse'
 *       400:
 *         description: Bad request - invalid ID
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Module configuration not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', authenticateJwt, moduleConfigController.getModuleConfigById);

/**
 * @swagger
 * /api/module-configs/{id}:
 *   put:
 *     tags: [Module Configurations]
 *     summary: Update a module configuration
 *     description: Updates an existing module configuration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Configuration ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateModuleConfigRequest'
 *     responses:
 *       200:
 *         description: Module configuration updated successfully
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
 *                   example: "Module configuration updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ModuleConfigResponse'
 *       400:
 *         description: Bad request - validation errors
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Module configuration not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id',
  authenticateJwt,
  ValidationPipe.validateBody(UpdateModuleConfigDto),
  moduleConfigController.updateModuleConfig,
);

/**
 * @swagger
 * /api/module-configs/{id}:
 *   delete:
 *     tags: [Module Configurations]
 *     summary: Delete a module configuration
 *     description: Soft deletes a module configuration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Configuration ID
 *     responses:
 *       200:
 *         description: Module configuration deleted successfully
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
 *                   example: "Module configuration deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     deleted:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Bad request - invalid ID
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Module configuration not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:id',
  authenticateJwt,
  moduleConfigController.deleteModuleConfig,
);

export default router;
