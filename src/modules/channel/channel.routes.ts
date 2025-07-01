import { Router } from 'express';
import { ChannelController } from '@/modules/channel/channel.controller';
import { ValidationPipe } from '@/common/pipes/validation.pipe';
import { CreateChannelDto } from '@/modules/channel/dto/create-channel.dto';
import { ChannelQueryDto } from '@/modules/channel/dto/channel-query.dto';

const router = Router();
const channelController = new ChannelController();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateChannelRequest:
 *       type: object
 *       required:
 *         - channelName
 *         - channelCode
 *       properties:
 *         channelName:
 *           type: string
 *           maxLength: 50
 *           description: Channel name
 *           example: "Email Marketing"
 *         channelCode:
 *           type: string
 *           maxLength: 10
 *           pattern: "^[A-Z0-9_]+$"
 *           description: Unique channel code (uppercase letters, numbers, and underscores only)
 *           example: "EMAIL_MKT"
 *         channelStatus:
 *           type: string
 *           enum: [active, inactive]
 *           description: Channel status
 *           default: active
 *           example: "active"
 *         projectId:
 *           type: string
 *           format: mongo-id
 *           description: ID of the project this channel belongs to
 *           example: "507f1f77bcf86cd799439011"
 *
 *     ChannelResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Channel's unique identifier
 *           example: "507f1f77bcf86cd799439011"
 *         channelName:
 *           type: string
 *           description: Channel name
 *           example: "Email Marketing"
 *         channelCode:
 *           type: string
 *           description: Unique channel code
 *           example: "EMAIL_MKT"
 *         channelStatus:
 *           type: string
 *           enum: [active, inactive]
 *           description: Channel status
 *           example: "active"
 *         projectId:
 *           type: string
 *           description: ID of the project this channel belongs to
 *           example: "507f1f77bcf86cd799439011"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Channel creation timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *
 *     ChannelListResponse:
 *       type: object
 *       properties:
 *         channels:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ChannelResponse'
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
 *               description: Total number of channels
 *               example: 25
 *             totalPages:
 *               type: integer
 *               description: Total number of pages
 *               example: 3
 *
 *   tags:
 *     - name: Channels
 *       description: Channel management endpoints
 */

/**
 * @swagger
 * /api/channels:
 *   post:
 *     tags: [Channels]
 *     summary: Create a new channel
 *     description: Creates a new channel with the provided information. Channel code must be unique.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateChannelRequest'
 *           example:
 *             channelName: "Email Marketing"
 *             channelCode: "EMAIL_MKT"
 *             channelStatus: "active"
 *             projectId: "507f1f77bcf86cd799439011"
 *     responses:
 *       201:
 *         description: Channel created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ChannelResponse'
 *             example:
 *               success: true
 *               message: "Channel created successfully"
 *               data:
 *                 _id: "507f1f77bcf86cd799439011"
 *                 channelName: "Email Marketing"
 *                 channelCode: "EMAIL_MKT"
 *                 channelStatus: "active"
 *                 projectId: "507f1f77bcf86cd799439011"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_fields:
 *                 summary: Missing required fields
 *                 value:
 *                   success: false
 *                   message: "Missing required fields: channelName, channelCode"
 *                   timestamp: "2024-01-15T10:30:00.000Z"
 *               invalid_code:
 *                 summary: Invalid channel code format
 *                 value:
 *                   success: false
 *                   message: "Channel code can only contain letters, numbers, and underscores"
 *                   timestamp: "2024-01-15T10:30:00.000Z"
 *               duplicate_code:
 *                 summary: Channel code already exists
 *                 value:
 *                   success: false
 *                   message: "Channel with code 'EMAIL_MKT' already exists"
 *                   timestamp: "2024-01-15T10:30:00.000Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/',
  ValidationPipe.validateBody(CreateChannelDto),
  channelController.createChannel,
);

/**
 * @swagger
 * /api/channels:
 *   get:
 *     tags: [Channels]
 *     summary: Get all channels with pagination
 *     description: Retrieves a paginated list of channels with optional status filtering
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *         example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter channels by status
 *         example: "active"
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *           format: mongo-id
 *         description: Filter channels by project ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Channels retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ChannelListResponse'
 *             example:
 *               success: true
 *               message: "Channels retrieved successfully"
 *               data:
 *                 channels:
 *                   - _id: "507f1f77bcf86cd799439011"
 *                     channelName: "Email Marketing"
 *                     channelCode: "EMAIL_MKT"
 *                     channelStatus: "active"
 *                     projectId: "507f1f77bcf86cd799439011"
 *                     createdAt: "2024-01-15T10:30:00.000Z"
 *                     updatedAt: "2024-01-15T10:30:00.000Z"
 *                   - _id: "507f1f77bcf86cd799439012"
 *                     channelName: "Social Media"
 *                     channelCode: "SOCIAL"
 *                     channelStatus: "active"
 *                     projectId: "507f1f77bcf86cd799439011"
 *                     createdAt: "2024-01-15T11:00:00.000Z"
 *                     updatedAt: "2024-01-15T11:00:00.000Z"
 *                 pagination:
 *                   page: 1
 *                   limit: 10
 *                   total: 25
 *                   totalPages: 3
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Bad request - invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Status must be either \"active\" or \"inactive\""
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/',
  ValidationPipe.validateQuery(ChannelQueryDto),
  channelController.getAllChannels,
);

/**
 * @swagger
 * /api/channels/active:
 *   get:
 *     tags: [Channels]
 *     summary: Get all active channels
 *     description: Retrieves a list of all active channels without pagination
 *     responses:
 *       200:
 *         description: Active channels retrieved successfully
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
 *                         $ref: '#/components/schemas/ChannelResponse'
 *             example:
 *               success: true
 *               message: "Active channels retrieved successfully"
 *               data:
 *                 - _id: "507f1f77bcf86cd799439011"
 *                   channelName: "Email Marketing"
 *                   channelCode: "EMAIL_MKT"
 *                   channelStatus: "active"
 *                   projectId: "507f1f77bcf86cd799439011"
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T10:30:00.000Z"
 *                 - _id: "507f1f77bcf86cd799439012"
 *                   channelName: "Social Media"
 *                   channelCode: "SOCIAL"
 *                   channelStatus: "active"
 *                   projectId: "507f1f77bcf86cd799439011"
 *                   createdAt: "2024-01-15T11:00:00.000Z"
 *                   updatedAt: "2024-01-15T11:00:00.000Z"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/active', channelController.getActiveChannels);

/**
 * @swagger
 * /api/channels/{id}:
 *   get:
 *     tags: [Channels]
 *     summary: Get channel by ID
 *     description: Retrieves a specific channel by its unique identifier
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Channel's unique identifier (MongoDB ObjectId)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Channel retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ChannelResponse'
 *             example:
 *               success: true
 *               message: "Channel retrieved successfully"
 *               data:
 *                 _id: "507f1f77bcf86cd799439011"
 *                 channelName: "Email Marketing"
 *                 channelCode: "EMAIL_MKT"
 *                 channelStatus: "active"
 *                 projectId: "507f1f77bcf86cd799439011"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Bad request - invalid channel ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Channel ID is required"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       404:
 *         description: Channel not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Channel not found"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', channelController.getChannelById);

/**
 * @swagger
 * /api/channels/code/{code}:
 *   get:
 *     tags: [Channels]
 *     summary: Get channel by code
 *     description: Retrieves a specific channel by its unique code
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[A-Z0-9_]+$"
 *         description: Channel's unique code (uppercase letters, numbers, and underscores)
 *         example: "EMAIL_MKT"
 *     responses:
 *       200:
 *         description: Channel retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ChannelResponse'
 *             example:
 *               success: true
 *               message: "Channel retrieved successfully"
 *               data:
 *                 _id: "507f1f77bcf86cd799439011"
 *                 channelName: "Email Marketing"
 *                 channelCode: "EMAIL_MKT"
 *                 channelStatus: "active"
 *                 projectId: "507f1f77bcf86cd799439011"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Bad request - invalid or missing channel code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Channel code is required"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       404:
 *         description: Channel not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Channel not found"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/code/:code', channelController.getChannelByCode);

/**
 * @swagger
 * /api/channels/project/{projectId}:
 *   get:
 *     tags: [Channels]
 *     summary: Get channels by project ID
 *     description: Retrieves all channels associated with a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project's unique identifier (MongoDB ObjectId)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Channels retrieved successfully
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
 *                         $ref: '#/components/schemas/ChannelResponse'
 *             example:
 *               success: true
 *               message: "Channels retrieved successfully"
 *               data:
 *                 - _id: "507f1f77bcf86cd799439011"
 *                   channelName: "Email Marketing"
 *                   channelCode: "EMAIL_MKT"
 *                   channelStatus: "active"
 *                   projectId: "507f1f77bcf86cd799439011"
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T10:30:00.000Z"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Bad request - invalid project ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid project ID format"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/project/:projectId', channelController.getChannelsByProjectId);

export default router;
