import { Router } from 'express';
import { PermissionController } from '@/modules/permission/permission.controller';
import { ValidationPipe } from '@/common/pipes/validation.pipe';
import { CreatePermissionDto } from '@/modules/permission/dto/create-permission.dto';
import { UpdatePermissionDto } from '@/modules/permission/dto/update-permission.dto';
import { PermissionQueryDto } from '@/modules/permission/dto/permission-query.dto';

const router = Router();
const permissionController = new PermissionController();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreatePermissionRequest:
 *       type: object
 *       required:
 *         - resourceId
 *         - action
 *       properties:
 *         resourceId:
 *           type: string
 *           description: MongoDB ObjectId of the resource
 *           example: "507f1f77bcf86cd799439011"
 *         action:
 *           type: string
 *           enum: [create, read, update, delete, view, edit, publish, approve, reject, export, import, share, download, upload, admin, manage, "*"]
 *           description: Action to be performed on the resource
 *           example: "read"
 *         effect:
 *           type: string
 *           enum: [allow, deny]
 *           description: Permission effect
 *           default: allow
 *           example: "allow"
 *         conditions:
 *           type: object
 *           description: Additional conditions for the permission
 *           example: { "timeRange": "9-17", "department": "sales" }
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Permission status
 *           default: active
 *           example: "active"
 *
 *     UpdatePermissionRequest:
 *       type: object
 *       properties:
 *         resourceId:
 *           type: string
 *           description: MongoDB ObjectId of the resource
 *           example: "507f1f77bcf86cd799439011"
 *         action:
 *           type: string
 *           enum: [create, read, update, delete, view, edit, publish, approve, reject, export, import, share, download, upload, admin, manage, "*"]
 *           description: Action to be performed on the resource
 *           example: "read"
 *         effect:
 *           type: string
 *           enum: [allow, deny]
 *           description: Permission effect
 *           example: "allow"
 *         conditions:
 *           type: object
 *           description: Additional conditions for the permission
 *           example: { "timeRange": "9-17", "department": "sales" }
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Permission status
 *           example: "active"
 *
 *     PermissionResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Permission's unique identifier
 *           example: "507f1f77bcf86cd799439011"
 *         resourceId:
 *           type: string
 *           description: Resource's unique identifier
 *           example: "507f1f77bcf86cd799439012"
 *         action:
 *           type: string
 *           enum: [create, read, update, delete, view, edit, publish, approve, reject, export, import, share, download, upload, admin, manage, "*"]
 *           description: Action to be performed on the resource
 *           example: "read"
 *         effect:
 *           type: string
 *           enum: [allow, deny]
 *           description: Permission effect
 *           example: "allow"
 *         conditions:
 *           type: object
 *           description: Additional conditions for the permission
 *           example: { "timeRange": "9-17", "department": "sales" }
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Permission status
 *           example: "active"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Permission creation timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *
 *     PermissionListResponse:
 *       type: object
 *       properties:
 *         permissions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PermissionResponse'
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
 *               description: Total number of permissions
 *               example: 25
 *             totalPages:
 *               type: integer
 *               description: Total number of pages
 *               example: 3
 *
 *   tags:
 *     - name: Permissions
 *       description: Permission management endpoints
 */

/**
 * @swagger
 * /api/permissions:
 *   post:
 *     tags: [Permissions]
 *     summary: Create a new permission
 *     description: Creates a new permission with the provided information. Resource ID and action combination must be unique.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePermissionRequest'
 *           example:
 *             resourceId: "507f1f77bcf86cd799439011"
 *             action: "read"
 *             effect: "allow"
 *             status: "active"
 *     responses:
 *       201:
 *         description: Permission created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PermissionResponse'
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  ValidationPipe.validateBody(CreatePermissionDto),
  permissionController.createPermission,
);

/**
 * @swagger
 * /api/permissions:
 *   get:
 *     tags: [Permissions]
 *     summary: Get all permissions with pagination and filtering
 *     description: Retrieves a paginated list of permissions with optional filtering
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
 *         description: Filter by permission status
 *       - in: query
 *         name: effect
 *         schema:
 *           type: string
 *           enum: [allow, deny]
 *         description: Filter by permission effect
 *       - in: query
 *         name: resourceId
 *         schema:
 *           type: string
 *         description: Filter by resource ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [create, read, update, delete, view, edit, publish, approve, reject, export, import, share, download, upload, admin, manage, "*"]
 *         description: Filter by action
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PermissionListResponse'
 */
router.get(
  '/',
  ValidationPipe.validateQuery(PermissionQueryDto),
  permissionController.getAllPermissions,
);

/**
 * @swagger
 * /api/permissions/active:
 *   get:
 *     tags: [Permissions]
 *     summary: Get all active permissions
 *     description: Retrieves all permissions with active status
 *     responses:
 *       200:
 *         description: Active permissions retrieved successfully
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
 *                         $ref: '#/components/schemas/PermissionResponse'
 */
router.get('/active', permissionController.getActivePermissions);

/**
 * @swagger
 * /api/permissions/{id}:
 *   get:
 *     tags: [Permissions]
 *     summary: Get permission by ID
 *     description: Retrieves a specific permission by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Permission ID
 *     responses:
 *       200:
 *         description: Permission retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PermissionResponse'
 *       404:
 *         description: Permission not found
 */
router.get('/:id', permissionController.getPermissionById);

/**
 * @swagger
 * /api/permissions/resource/{resourceId}:
 *   get:
 *     tags: [Permissions]
 *     summary: Get permissions by resource ID
 *     description: Retrieves all permissions for a specific resource
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
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
 *                         $ref: '#/components/schemas/PermissionResponse'
 */
router.get(
  '/resource/:resourceId',
  permissionController.getPermissionsByResourceId,
);

/**
 * @swagger
 * /api/permissions/{id}:
 *   put:
 *     tags: [Permissions]
 *     summary: Update permission
 *     description: Updates an existing permission
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Permission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePermissionRequest'
 *     responses:
 *       200:
 *         description: Permission updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PermissionResponse'
 *       404:
 *         description: Permission not found
 *       400:
 *         description: Bad request - validation errors
 */
router.put(
  '/:id',
  ValidationPipe.validateBody(UpdatePermissionDto),
  permissionController.updatePermission,
);

/**
 * @swagger
 * /api/permissions/{id}:
 *   delete:
 *     tags: [Permissions]
 *     summary: Delete permission
 *     description: Soft deletes a permission (marks as deleted)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Permission ID
 *     responses:
 *       200:
 *         description: Permission deleted successfully
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
 *         description: Permission not found
 */
router.delete('/:id', permissionController.deletePermission);

export default router;
