import { Router } from 'express';
import { RoleController } from '@/modules/role/role.controller';
import { ValidationPipe } from '@/common/pipes/validation.pipe';
import { CreateRoleDto } from '@/modules/role/dto/create-role.dto';
import { UpdateRoleDto } from '@/modules/role/dto/update-role.dto';
import { RoleQueryDto } from '@/modules/role/dto/role-query.dto';

const router = Router();
const roleController = new RoleController();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateRoleRequest:
 *       type: object
 *       required:
 *         - channelId
 *         - roleName
 *         - roleCode
 *       properties:
 *         channelId:
 *           type: string
 *           description: MongoDB ObjectId of the channel
 *           example: "507f1f77bcf86cd799439011"
 *         roleName:
 *           type: string
 *           maxLength: 100
 *           description: Role name
 *           example: "Sales Manager"
 *         roleCode:
 *           type: integer
 *           minimum: 1
 *           maximum: 999999
 *           description: Unique role code within the channel
 *           example: 101
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Role description
 *           example: "Responsible for managing sales team and targets"
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of permission IDs
 *           example: ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
 *         isSystem:
 *           type: boolean
 *           description: Whether this is a system role
 *           default: false
 *           example: false
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Role status
 *           default: active
 *           example: "active"
 *
 *     UpdateRoleRequest:
 *       type: object
 *       properties:
 *         roleName:
 *           type: string
 *           maxLength: 100
 *           description: Role name
 *           example: "Sales Manager"
 *         roleCode:
 *           type: integer
 *           minimum: 1
 *           maximum: 999999
 *           description: Unique role code within the channel
 *           example: 101
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Role description
 *           example: "Responsible for managing sales team and targets"
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of permission IDs
 *           example: ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
 *         isSystem:
 *           type: boolean
 *           description: Whether this is a system role
 *           example: false
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Role status
 *           example: "active"
 *
 *     RoleResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Role's unique identifier
 *           example: "507f1f77bcf86cd799439011"
 *         channelId:
 *           type: string
 *           description: Channel's unique identifier
 *           example: "507f1f77bcf86cd799439010"
 *         roleName:
 *           type: string
 *           description: Role name
 *           example: "Sales Manager"
 *         roleCode:
 *           type: integer
 *           description: Role code
 *           example: 101
 *         description:
 *           type: string
 *           description: Role description
 *           example: "Responsible for managing sales team and targets"
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of permission IDs
 *           example: ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
 *         isSystem:
 *           type: boolean
 *           description: Whether this is a system role
 *           example: false
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Role status
 *           example: "active"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Role creation timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *
 *     RoleListResponse:
 *       type: object
 *       properties:
 *         roles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RoleResponse'
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
 *               description: Total number of roles
 *               example: 25
 *             totalPages:
 *               type: integer
 *               description: Total number of pages
 *               example: 3
 *
 *   tags:
 *     - name: Roles
 *       description: Role management endpoints
 */

/**
 * @swagger
 * /api/roles:
 *   post:
 *     tags: [Roles]
 *     summary: Create a new role
 *     description: Creates a new role with the provided information. Role name and code must be unique within the channel.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoleRequest'
 *     responses:
 *       201:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/RoleResponse'
 *       400:
 *         description: Bad request - validation errors
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  ValidationPipe.validateBody(CreateRoleDto),
  roleController.createRole,
);

/**
 * @swagger
 * /api/roles:
 *   get:
 *     tags: [Roles]
 *     summary: Get all roles with pagination and filtering
 *     description: Retrieves a paginated list of roles with optional filtering
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
 *         description: Filter by role status
 *       - in: query
 *         name: channelId
 *         schema:
 *           type: string
 *         description: Filter by channel ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in role name and description
 *       - in: query
 *         name: isSystem
 *         schema:
 *           type: boolean
 *         description: Filter by system roles
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/RoleListResponse'
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  ValidationPipe.validateQuery(RoleQueryDto),
  roleController.getAllRoles,
);

/**
 * @swagger
 * /api/roles/active:
 *   get:
 *     tags: [Roles]
 *     summary: Get active roles
 *     description: Retrieves all active roles, optionally filtered by channel
 *     parameters:
 *       - in: query
 *         name: channelId
 *         schema:
 *           type: string
 *         description: Filter by channel ID
 *     responses:
 *       200:
 *         description: Active roles retrieved successfully
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
 *                         $ref: '#/components/schemas/RoleResponse'
 *       500:
 *         description: Internal server error
 */
router.get('/active', roleController.getActiveRoles);

/**
 * @swagger
 * /api/roles/system:
 *   get:
 *     tags: [Roles]
 *     summary: Get system roles
 *     description: Retrieves all system roles
 *     responses:
 *       200:
 *         description: System roles retrieved successfully
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
 *                         $ref: '#/components/schemas/RoleResponse'
 *       500:
 *         description: Internal server error
 */
router.get('/system', roleController.getSystemRoles);

/**
 * @swagger
 * /api/roles/code/{code}:
 *   get:
 *     tags: [Roles]
 *     summary: Get role by code
 *     description: Retrieves a role by its code, optionally within a specific channel
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role code
 *       - in: query
 *         name: channelId
 *         schema:
 *           type: string
 *         description: Channel ID to search within
 *     responses:
 *       200:
 *         description: Role retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/RoleResponse'
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */
router.get('/code/:code', roleController.getRoleByCode);

/**
 * @swagger
 * /api/roles/channel/{channelId}:
 *   get:
 *     tags: [Roles]
 *     summary: Get roles by channel ID
 *     description: Retrieves all roles for a specific channel
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Channel ID
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
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
 *                         $ref: '#/components/schemas/RoleResponse'
 *       400:
 *         description: Bad request - invalid channel ID
 *       500:
 *         description: Internal server error
 */
router.get('/channel/:channelId', roleController.getRolesByChannelId);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     tags: [Roles]
 *     summary: Get role by ID
 *     description: Retrieves a specific role by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/RoleResponse'
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', roleController.getRoleById);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     tags: [Roles]
 *     summary: Update role
 *     description: Updates an existing role with the provided information
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoleRequest'
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/RoleResponse'
 *       400:
 *         description: Bad request - validation errors
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id',
  ValidationPipe.validateBody(UpdateRoleDto),
  roleController.updateRole,
);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     tags: [Roles]
 *     summary: Delete role
 *     description: Soft deletes a role (marks as deleted). System roles cannot be deleted.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
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
 *                         id:
 *                           type: string
 *                           description: Deleted role ID
 *       400:
 *         description: Bad request - system roles cannot be deleted
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', roleController.deleteRole);

export default router;
