import { Router } from 'express';
import { DesignationController } from '@/modules/designation/designation.controller';
import { ValidationPipe } from '@/common/pipes/validation.pipe';
import { CreateDesignationDto } from '@/modules/designation/dto/create-designation.dto';
import { DesignationQueryDto } from '@/modules/designation/dto/designation-query.dto';

const router = Router();
const designationController = new DesignationController();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateDesignationRequest:
 *       type: object
 *       required:
 *         - channelId
 *         - roleId
 *         - hierarchyId
 *         - designationName
 *         - designationCode
 *       properties:
 *         channelId:
 *           type: string
 *           format: mongo-id
 *           description: ID of the channel this designation belongs to
 *           example: "507f1f77bcf86cd799439011"
 *         roleId:
 *           type: string
 *           format: mongo-id
 *           description: ID of the role this designation belongs to
 *           example: "507f1f77bcf86cd799439012"
 *         hierarchyId:
 *           type: string
 *           format: mongo-id
 *           description: ID of the hierarchy this designation belongs to
 *           example: "507f1f77bcf86cd799439013"
 *         designationName:
 *           type: string
 *           maxLength: 50
 *           description: Designation name
 *           example: "Sales Manager"
 *         designationCode:
 *           type: string
 *           maxLength: 10
 *           pattern: "^[A-Z0-9_]+$"
 *           description: Unique designation code (uppercase letters, numbers, and underscores only)
 *           example: "SALES_MGR"
 *         designationStatus:
 *           type: string
 *           enum: [active, inactive]
 *           description: Designation status
 *           default: active
 *           example: "active"
 *         designationDescription:
 *           type: string
 *           maxLength: 500
 *           description: Description of the designation
 *           example: "Manages the sales team and oversees sales operations"
 *         designationOrder:
 *           type: integer
 *           minimum: 0
 *           description: Order of the designation in the hierarchy
 *           default: 0
 *           example: 10
 *
 *     DesignationResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Designation's unique identifier
 *           example: "507f1f77bcf86cd799439011"
 *         channelId:
 *           type: string
 *           description: ID of the channel this designation belongs to
 *           example: "507f1f77bcf86cd799439011"
 *         roleId:
 *           type: string
 *           description: ID of the role this designation belongs to
 *           example: "507f1f77bcf86cd799439012"
 *         hierarchyId:
 *           type: string
 *           description: ID of the hierarchy this designation belongs to
 *           example: "507f1f77bcf86cd799439013"
 *         designationName:
 *           type: string
 *           description: Designation name
 *           example: "Sales Manager"
 *         designationCode:
 *           type: string
 *           description: Unique designation code
 *           example: "SALES_MGR"
 *         designationStatus:
 *           type: string
 *           enum: [active, inactive]
 *           description: Designation status
 *           example: "active"
 *         designationDescription:
 *           type: string
 *           description: Description of the designation
 *           example: "Manages the sales team and oversees sales operations"
 *         designationOrder:
 *           type: integer
 *           description: Order of the designation in the hierarchy
 *           example: 10
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Designation creation timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *
 *     DesignationListResponse:
 *       type: object
 *       properties:
 *         designations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DesignationResponse'
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
 *               description: Total number of designations
 *               example: 25
 *             totalPages:
 *               type: integer
 *               description: Total number of pages
 *               example: 3
 *
 *   tags:
 *     - name: Designations
 *       description: Designation management endpoints
 */

/**
 * @swagger
 * /api/designations:
 *   post:
 *     tags: [Designations]
 *     summary: Create a new designation
 *     description: Creates a new designation with the provided information. Designation code must be unique within a channel.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDesignationRequest'
 *     responses:
 *       201:
 *         description: Designation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DesignationResponse'
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/',
  ValidationPipe.validateBody(CreateDesignationDto),
  designationController.createDesignation,
);

/**
 * @swagger
 * /api/designations:
 *   get:
 *     tags: [Designations]
 *     summary: Get all designations with pagination
 *     description: Retrieves a paginated list of designations with optional filtering
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
 *         description: Filter by designation status
 *       - in: query
 *         name: channelId
 *         schema:
 *           type: string
 *           format: mongo-id
 *         description: Filter by channel ID
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: string
 *           format: mongo-id
 *         description: Filter by role ID
 *       - in: query
 *         name: hierarchyId
 *         schema:
 *           type: string
 *           format: mongo-id
 *         description: Filter by hierarchy ID
 *     responses:
 *       200:
 *         description: Designations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DesignationListResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/',
  ValidationPipe.validateQuery(DesignationQueryDto),
  designationController.getAllDesignations,
);

/**
 * @swagger
 * /api/designations/active:
 *   get:
 *     tags: [Designations]
 *     summary: Get all active designations
 *     description: Retrieves a list of all active designations
 *     responses:
 *       200:
 *         description: Active designations retrieved successfully
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
 *                         $ref: '#/components/schemas/DesignationResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/active', designationController.getActiveDesignations);

/**
 * @swagger
 * /api/designations/by-channel/{channelId}:
 *   get:
 *     tags: [Designations]
 *     summary: Get designations by channel ID
 *     description: Retrieves all designations belonging to a specific channel
 *     parameters:
 *       - in: path
 *         name: channelId
 *         schema:
 *           type: string
 *           format: mongo-id
 *         required: true
 *         description: ID of the channel
 *     responses:
 *       200:
 *         description: Designations retrieved successfully
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
 *                         $ref: '#/components/schemas/DesignationResponse'
 *       400:
 *         description: Bad request - Invalid channel ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/by-channel/:channelId',
  designationController.getDesignationsByChannelId,
);

/**
 * @swagger
 * /api/designations/by-hierarchy/{hierarchyId}:
 *   get:
 *     tags: [Designations]
 *     summary: Get designations by hierarchy ID
 *     description: Retrieves all designations belonging to a specific hierarchy
 *     parameters:
 *       - in: path
 *         name: hierarchyId
 *         schema:
 *           type: string
 *           format: mongo-id
 *         required: true
 *         description: ID of the hierarchy
 *     responses:
 *       200:
 *         description: Designations retrieved successfully
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
 *                         $ref: '#/components/schemas/DesignationResponse'
 *       400:
 *         description: Bad request - Invalid hierarchy ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/by-hierarchy/:hierarchyId',
  designationController.getDesignationsByHierarchyId,
);

/**
 * @swagger
 * /api/designations/by-role/{roleId}:
 *   get:
 *     tags: [Designations]
 *     summary: Get designations by role ID
 *     description: Retrieves all designations belonging to a specific role
 *     parameters:
 *       - in: path
 *         name: roleId
 *         schema:
 *           type: string
 *           format: mongo-id
 *         required: true
 *         description: ID of the role
 *     responses:
 *       200:
 *         description: Designations retrieved successfully
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
 *                         $ref: '#/components/schemas/DesignationResponse'
 *       400:
 *         description: Bad request - Invalid role ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/by-role/:roleId', designationController.getDesignationsByRoleId);

/**
 * @swagger
 * /api/designations/{id}:
 *   get:
 *     tags: [Designations]
 *     summary: Get designation by ID
 *     description: Retrieves a specific designation by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: mongo-id
 *         required: true
 *         description: ID of the designation
 *     responses:
 *       200:
 *         description: Designation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DesignationResponse'
 *       404:
 *         description: Designation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', designationController.getDesignationById);

/**
 * @swagger
 * /api/designations/code/{code}:
 *   get:
 *     tags: [Designations]
 *     summary: Get designation by code
 *     description: Retrieves a specific designation by its code within a channel
 *     parameters:
 *       - in: path
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Code of the designation
 *       - in: query
 *         name: channelId
 *         schema:
 *           type: string
 *           format: mongo-id
 *         required: true
 *         description: ID of the channel
 *     responses:
 *       200:
 *         description: Designation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DesignationResponse'
 *       400:
 *         description: Bad request - Missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Designation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/code/:code', designationController.getDesignationByCode);

export default router;
