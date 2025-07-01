import { Router } from 'express';
import { HierarchyController } from '@/modules/hierarchy/hierarchy.controller';
import { ValidationPipe } from '@/common/pipes/validation.pipe';
import {
  CreateHierarchyDto,
  UpdateHierarchyDto,
  HierarchyQueryDto,
  HierarchyByDesignationDto,
} from '@/modules/hierarchy/dto';

const router = Router();
const hierarchyController = new HierarchyController();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateHierarchyRequest:
 *       type: object
 *       required:
 *         - channelId
 *         - hierarchyName
 *         - hierarchyLevelCode
 *         - hierarchyLevel
 *       properties:
 *         channelId:
 *           type: string
 *           description: Reference to the channel
 *           example: "507f1f77bcf86cd799439011"
 *         hierarchyName:
 *           type: string
 *           maxLength: 50
 *           description: Hierarchy name
 *           example: "National"
 *         hierarchyLevelCode:
 *           type: string
 *           maxLength: 10
 *           pattern: "^[A-Z0-9_]+$"
 *           description: Unique level code within channel (uppercase letters, numbers, and underscores only)
 *           example: "NAT"
 *         hierarchyLevel:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           description: Hierarchy level (1 for root level)
 *           example: 1
 *         hierarchyParentId:
 *           type: string
 *           description: Reference to parent hierarchy (optional for root level)
 *           example: "507f1f77bcf86cd799439012"
 *         hierarchyDescription:
 *           type: string
 *           maxLength: 500
 *           description: Optional description
 *           example: "National level hierarchy"
 *         hierarchyOrder:
 *           type: integer
 *           minimum: 0
 *           description: Order within the same level
 *           default: 0
 *           example: 1
 *         hierarchyStatus:
 *           type: string
 *           enum: [active, inactive]
 *           description: Hierarchy status
 *           default: active
 *           example: "active"
 *
 *     UpdateHierarchyRequest:
 *       type: object
 *       properties:
 *         hierarchyName:
 *           type: string
 *           maxLength: 50
 *           description: Hierarchy name
 *           example: "National Updated"
 *         hierarchyLevelCode:
 *           type: string
 *           maxLength: 10
 *           pattern: "^[A-Z0-9_]+$"
 *           description: Unique level code within channel
 *           example: "NAT_UPD"
 *         hierarchyDescription:
 *           type: string
 *           maxLength: 500
 *           description: Description
 *           example: "Updated national level hierarchy"
 *         hierarchyOrder:
 *           type: integer
 *           minimum: 0
 *           description: Order within the same level
 *           example: 2
 *         hierarchyStatus:
 *           type: string
 *           enum: [active, inactive]
 *           description: Hierarchy status
 *           example: "inactive"
 *
 *     HierarchyResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Hierarchy's unique identifier
 *           example: "507f1f77bcf86cd799439011"
 *         channelId:
 *           type: string
 *           description: Reference to the channel
 *           example: "507f1f77bcf86cd799439012"
 *         channelName:
 *           type: string
 *           description: Channel name (populated)
 *           example: "Email Marketing"
 *         hierarchyName:
 *           type: string
 *           description: Hierarchy name
 *           example: "National"
 *         hierarchyLevelCode:
 *           type: string
 *           description: Unique level code within channel
 *           example: "NAT"
 *         hierarchyLevel:
 *           type: integer
 *           description: Hierarchy level
 *           example: 1
 *         hierarchyParentId:
 *           type: string
 *           description: Reference to parent hierarchy
 *           example: null
 *         parentName:
 *           type: string
 *           description: Parent hierarchy name (populated)
 *           example: null
 *         hierarchyDescription:
 *           type: string
 *           description: Description
 *           example: "National level hierarchy"
 *         hierarchyOrder:
 *           type: integer
 *           description: Order within the same level
 *           example: 1
 *         hierarchyStatus:
 *           type: string
 *           enum: [active, inactive]
 *           description: Hierarchy status
 *           example: "active"
 *         isActive:
 *           type: boolean
 *           description: Whether hierarchy is active
 *           example: true
 *         isRoot:
 *           type: boolean
 *           description: Whether hierarchy is at root level
 *           example: true
 *         hasParent:
 *           type: boolean
 *           description: Whether hierarchy has a parent
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Hierarchy creation timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *
 *     HierarchyListResponse:
 *       type: object
 *       properties:
 *         hierarchies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/HierarchyResponse'
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
 *               description: Total number of hierarchies
 *               example: 25
 *             totalPages:
 *               type: integer
 *               description: Total number of pages
 *               example: 3
 *
 *   tags:
 *     - name: Hierarchies
 *       description: Hierarchy management endpoints
 */

/**
 * @swagger
 * /api/hierarchies:
 *   post:
 *     tags: [Hierarchies]
 *     summary: Create a new hierarchy
 *     description: Creates a new hierarchy with the provided information. Level code must be unique within the channel.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateHierarchyRequest'
 *           example:
 *             channelId: "507f1f77bcf86cd799439011"
 *             hierarchyName: "National"
 *             hierarchyLevelCode: "NAT"
 *             hierarchyLevel: 1
 *             hierarchyDescription: "National level hierarchy"
 *             hierarchyOrder: 1
 *             hierarchyStatus: "active"
 *     responses:
 *       201:
 *         description: Hierarchy created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/HierarchyResponse'
 *       400:
 *         description: Bad request - validation errors
 *       404:
 *         description: Channel not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  ValidationPipe.validateBody(CreateHierarchyDto),
  hierarchyController.createHierarchy,
);

/**
 * @swagger
 * /api/hierarchies:
 *   get:
 *     tags: [Hierarchies]
 *     summary: Get all hierarchies with pagination and filtering
 *     description: Retrieves a paginated list of hierarchies with optional filtering by channel, level, and status
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
 *         name: channelId
 *         schema:
 *           type: string
 *         description: Filter by channel ID
 *       - in: query
 *         name: hierarchyLevel
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter by hierarchy level
 *       - in: query
 *         name: hierarchyStatus
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Hierarchies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/HierarchyListResponse'
 */
router.get(
  '/',
  ValidationPipe.validateQuery(HierarchyQueryDto),
  hierarchyController.getAllHierarchies,
);

/**
 * @swagger
 * /api/hierarchies/hierarchyTeamMemberList:
 *   get:
 *     tags: [Hierarchies]
 *     summary: Get hierarchy team member list
 *     description: Retrieves hierarchies or team members based on current user and query parameters
 *     parameters:
 *       - in: query
 *         name: teamMembers
 *         schema:
 *           type: boolean
 *         description: If true, returns team members; otherwise returns hierarchies
 *     responses:
 *       200:
 *         description: Data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       oneOf:
 *                         - type: array
 *                           items:
 *                             $ref: '#/components/schemas/HierarchyResponse'
 *                         - type: array
 *                           items:
 *                             type: object
 *                             description: Agent/Team member data
 *       400:
 *         description: Bad request - missing current user
 *       500:
 *         description: Internal server error
 */
router.get(
  '/hierarchyTeamMemberList',
  hierarchyController.getHierarchyTeamMemberList,
);

/**
 * @swagger
 * /api/hierarchies/{id}:
 *   get:
 *     tags: [Hierarchies]
 *     summary: Get hierarchy by ID
 *     description: Retrieves a specific hierarchy by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hierarchy ID
 *     responses:
 *       200:
 *         description: Hierarchy retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/HierarchyResponse'
 *       404:
 *         description: Hierarchy not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', hierarchyController.getHierarchyById);

/**
 * @swagger
 * /api/hierarchies/{id}:
 *   put:
 *     tags: [Hierarchies]
 *     summary: Update hierarchy
 *     description: Updates an existing hierarchy with the provided information
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hierarchy ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateHierarchyRequest'
 *     responses:
 *       200:
 *         description: Hierarchy updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/HierarchyResponse'
 *       400:
 *         description: Bad request - validation errors
 *       404:
 *         description: Hierarchy not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id',
  ValidationPipe.validateBody(UpdateHierarchyDto),
  hierarchyController.updateHierarchy,
);

/**
 * @swagger
 * /api/hierarchies/{id}:
 *   delete:
 *     tags: [Hierarchies]
 *     summary: Delete hierarchy
 *     description: Soft deletes a hierarchy. Cannot delete if it has child hierarchies.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hierarchy ID
 *     responses:
 *       200:
 *         description: Hierarchy deleted successfully
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
 *       400:
 *         description: Bad request - hierarchy has children
 *       404:
 *         description: Hierarchy not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', hierarchyController.deleteHierarchy);

/**
 * @swagger
 * /api/hierarchies/channel/{channelId}:
 *   get:
 *     tags: [Hierarchies]
 *     summary: Get hierarchies by channel
 *     description: Retrieves all hierarchies for a specific channel, ordered by level and order
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Channel ID
 *     responses:
 *       200:
 *         description: Hierarchies retrieved successfully
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
 *                         $ref: '#/components/schemas/HierarchyResponse'
 *       400:
 *         description: Bad request - invalid channel ID
 *       500:
 *         description: Internal server error
 */
router.get('/channel/:channelId', hierarchyController.getHierarchiesByChannel);

/**
 * @swagger
 * /api/hierarchies/channel/{channelId}/level:
 *   get:
 *     tags: [Hierarchies]
 *     summary: Get hierarchies by channel and level
 *     description: Retrieves hierarchies for a specific channel at a specific level
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Channel ID
 *       - in: query
 *         name: hierarchyLevel
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Hierarchy level
 *     responses:
 *       200:
 *         description: Hierarchies retrieved successfully
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
 *                         $ref: '#/components/schemas/HierarchyResponse'
 *       400:
 *         description: Bad request - invalid parameters
 *       500:
 *         description: Internal server error
 */
router.get(
  '/channel/:channelId/level',
  hierarchyController.getHierarchiesByChannelAndLevel,
);

/**
 * @swagger
 * /api/hierarchies/channel/{channelId}/roots:
 *   get:
 *     tags: [Hierarchies]
 *     summary: Get root hierarchies by channel
 *     description: Retrieves all root-level hierarchies for a specific channel
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Channel ID
 *     responses:
 *       200:
 *         description: Root hierarchies retrieved successfully
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
 *                         $ref: '#/components/schemas/HierarchyResponse'
 *       400:
 *         description: Bad request - invalid channel ID
 *       500:
 *         description: Internal server error
 */
router.get('/channel/:channelId/roots', hierarchyController.getRootHierarchies);

/**
 * @swagger
 * /api/hierarchies/parent/{parentId}/children:
 *   get:
 *     tags: [Hierarchies]
 *     summary: Get child hierarchies
 *     description: Retrieves all child hierarchies for a specific parent hierarchy
 *     parameters:
 *       - in: path
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Parent hierarchy ID
 *     responses:
 *       200:
 *         description: Child hierarchies retrieved successfully
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
 *                         $ref: '#/components/schemas/HierarchyResponse'
 *       400:
 *         description: Bad request - invalid parent ID
 *       500:
 *         description: Internal server error
 */
router.get(
  '/parent/:parentId/children',
  hierarchyController.getChildHierarchies,
);

/**
 * @swagger
 * /api/hierarchies/agent/{agentId}:
 *   get:
 *     tags: [Hierarchies]
 *     summary: Get hierarchy information by agent ID
 *     description: Retrieves hierarchy information and lower level hierarchies based on agent's designation
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Agent ID
 *     responses:
 *       200:
 *         description: Hierarchy information retrieved successfully
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
 *                         hierarchies:
 *                           type: array
 *                           items:
 *                             type: string
 *                             description: Designation names
 *       400:
 *         description: Bad request - invalid agent ID
 *       404:
 *         description: Agent not found
 *       500:
 *         description: Internal server error
 */
router.get('/agent/:agentId', hierarchyController.getHierarchyByAgentId);

/**
 * @swagger
 * /api/hierarchies/channel/{channelId}/designation:
 *   get:
 *     tags: [Hierarchies]
 *     summary: Get agents under a designation hierarchy
 *     description: Retrieves all agents under hierarchies lower than the specified designation's hierarchy level
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Channel ID
 *       - in: query
 *         name: designationName
 *         required: true
 *         schema:
 *           type: string
 *         description: Designation name to lookup
 *     responses:
 *       200:
 *         description: Agents retrieved successfully
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
 *                         type: object
 *                         properties:
 *                           agentId:
 *                             type: string
 *                             description: Agent's unique identifier
 *                           fullName:
 *                             type: string
 *                             description: Agent's full name
 *       400:
 *         description: Bad request - invalid parameters
 *       404:
 *         description: Channel or designation not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/channel/:channelId/designation',
  ValidationPipe.validateQuery(HierarchyByDesignationDto),
  hierarchyController.getAgentsByHierarchyDesignation,
);

export default router;
