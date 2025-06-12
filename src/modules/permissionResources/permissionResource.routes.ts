import { Router } from 'express';
import { PermissionResourceController } from '@/modules/permissionResources/permissionResource.controller';
import { ValidationPipe } from '@/common/pipes/validation.pipe';
import { CreatePermissionResourceDto } from '@/modules/permissionResources/dto/create-permission-resource.dto';
import { UpdatePermissionResourceDto } from '@/modules/permissionResources/dto/update-permission-resource.dto';
import { PermissionResourceQueryDto } from '@/modules/permissionResources/dto/permission-resource-query.dto';

const router = Router();
const resourceController = new PermissionResourceController();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreatePermissionResourceRequest:
 *       type: object
 *       required:
 *         - name
 *         - identifier
 *         - type
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Human readable resource name
 *           example: "User Management"
 *         identifier:
 *           type: string
 *           maxLength: 100
 *           pattern: "^[a-z][a-z0-9._-]*$"
 *           description: Unique resource identifier (lowercase letters, numbers, dots, underscores, and hyphens)
 *           example: "users.management"
 *         type:
 *           type: string
 *           enum: [module, api, page, ui, feature]
 *           description: Resource type
 *           example: "module"
 *         parentId:
 *           type: string
 *           description: Parent resource MongoDB ObjectId for hierarchy
 *           example: "507f1f77bcf86cd799439011"
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Resource status
 *           default: active
 *           example: "active"
 *
 *     UpdatePermissionResourceRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Human readable resource name
 *           example: "User Management"
 *         identifier:
 *           type: string
 *           maxLength: 100
 *           pattern: "^[a-z][a-z0-9._-]*$"
 *           description: Unique resource identifier
 *           example: "users.management"
 *         type:
 *           type: string
 *           enum: [module, api, page, ui, feature]
 *           description: Resource type
 *           example: "module"
 *         parentId:
 *           type: string
 *           description: Parent resource MongoDB ObjectId
 *           example: "507f1f77bcf86cd799439011"
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Resource status
 *           example: "active"
 *
 *     PermissionResourceResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Resource's unique identifier
 *           example: "507f1f77bcf86cd799439011"
 *         name:
 *           type: string
 *           description: Human readable resource name
 *           example: "User Management"
 *         identifier:
 *           type: string
 *           description: Unique resource identifier
 *           example: "users.management"
 *         type:
 *           type: string
 *           enum: [module, api, page, ui, feature]
 *           description: Resource type
 *           example: "module"
 *         parentId:
 *           type: string
 *           description: Parent resource ID
 *           example: "507f1f77bcf86cd799439010"
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Resource status
 *           example: "active"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Resource creation timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *
 *     PermissionResourceListResponse:
 *       type: object
 *       properties:
 *         resources:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PermissionResourceResponse'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               description: Current page number
 *               example: 1
 *             limit:
 *               type: integer
 *               description: Number of items per page
 *               example: 10
 *             total:
 *               type: integer
 *               description: Total number of resources
 *               example: 25
 *             totalPages:
 *               type: integer
 *               description: Total number of pages
 *               example: 3
 *
 *   tags:
 *     - name: Permission Resources
 *       description: Permission resource management endpoints
 */

/**
 * @swagger
 * /api/permission-resources:
 *   post:
 *     tags: [Permission Resources]
 *     summary: Create a new permission resource
 *     description: Creates a new permission resource with the provided information. Resource identifier must be unique.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePermissionResourceRequest'
 *           example:
 *             name: "User Management"
 *             identifier: "users.management"
 *             type: "module"
 *             status: "active"
 *     responses:
 *       201:
 *         description: Resource created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PermissionResourceResponse'
 *       400:
 *         description: Bad request - validation errors
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  ValidationPipe.validateBody(CreatePermissionResourceDto),
  resourceController.createResource,
);

/**
 * @swagger
 * /api/permission-resources:
 *   get:
 *     tags: [Permission Resources]
 *     summary: Get all permission resources with pagination and filtering
 *     description: Retrieves a paginated list of permission resources with optional filtering
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by resource status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [module, api, page, ui, feature]
 *         description: Filter by resource type
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *         description: Filter by parent resource ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and identifier fields
 *     responses:
 *       200:
 *         description: Resources retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PermissionResourceListResponse'
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  ValidationPipe.validateQuery(PermissionResourceQueryDto),
  resourceController.getAllResources,
);

/**
 * @swagger
 * /api/permission-resources/active:
 *   get:
 *     tags: [Permission Resources]
 *     summary: Get all active permission resources
 *     description: Retrieves all active permission resources without pagination
 *     responses:
 *       200:
 *         description: Active resources retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PermissionResourceResponse'
 *       500:
 *         description: Internal server error
 */
router.get('/active', resourceController.getActiveResources);

/**
 * @swagger
 * /api/permission-resources/type/{type}:
 *   get:
 *     tags: [Permission Resources]
 *     summary: Get permission resources by type
 *     description: Retrieves all permission resources of a specific type
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [module, api, page, ui, feature]
 *         description: Resource type to filter by
 *     responses:
 *       200:
 *         description: Resources retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PermissionResourceResponse'
 *       400:
 *         description: Invalid resource type
 *       500:
 *         description: Internal server error
 */
router.get('/type/:type', resourceController.getResourcesByType);

/**
 * @swagger
 * /api/permission-resources/parent/{parentId}:
 *   get:
 *     tags: [Permission Resources]
 *     summary: Get permission resources by parent ID
 *     description: Retrieves all permission resources that have the specified parent ID
 *     parameters:
 *       - in: path
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Parent resource ID
 *     responses:
 *       200:
 *         description: Child resources retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PermissionResourceResponse'
 *       400:
 *         description: Parent ID is required
 *       500:
 *         description: Internal server error
 */
router.get('/parent/:parentId', resourceController.getResourcesByParentId);

/**
 * @swagger
 * /api/permission-resources/identifier/{identifier}:
 *   get:
 *     tags: [Permission Resources]
 *     summary: Get permission resource by identifier
 *     description: Retrieves a specific permission resource by its unique identifier
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource identifier
 *         example: "users.management"
 *     responses:
 *       200:
 *         description: Resource retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PermissionResourceResponse'
 *       404:
 *         description: Resource not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/identifier/:identifier',
  resourceController.getResourceByIdentifier,
);

/**
 * @swagger
 * /api/permission-resources/{id}:
 *   get:
 *     tags: [Permission Resources]
 *     summary: Get permission resource by ID
 *     description: Retrieves a specific permission resource by its MongoDB ObjectId
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource MongoDB ObjectId
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Resource retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PermissionResourceResponse'
 *       404:
 *         description: Resource not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', resourceController.getResourceById);

/**
 * @swagger
 * /api/permission-resources/{id}:
 *   put:
 *     tags: [Permission Resources]
 *     summary: Update permission resource
 *     description: Updates an existing permission resource with the provided information
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePermissionResourceRequest'
 *           example:
 *             name: "Updated User Management"
 *             status: "inactive"
 *     responses:
 *       200:
 *         description: Resource updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PermissionResourceResponse'
 *       400:
 *         description: Bad request - validation errors
 *       404:
 *         description: Resource not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id',
  ValidationPipe.validateBody(UpdatePermissionResourceDto),
  resourceController.updateResource,
);

/**
 * @swagger
 * /api/permission-resources/{id}:
 *   delete:
 *     tags: [Permission Resources]
 *     summary: Delete permission resource
 *     description: Deletes an existing permission resource
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Resource deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         deleted:
 *                           type: boolean
 *                           example: true
 *       404:
 *         description: Resource not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', resourceController.deleteResource);

export default router;
