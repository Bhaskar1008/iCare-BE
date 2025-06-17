import { Router } from 'express';
import { AgentController } from './agent.controller';
import { ValidationPipe } from '@/common/pipes/validation.pipe';
import { CreateAgentDto } from '@/modules/agent/dto/create-agent.dto';
import { AgentQueryDto } from '@/modules/agent/dto/agent-query.dto';

const router = Router();
const agentController = new AgentController();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateAgentRequest:
 *       type: object
 *       required:
 *         - userId
 *         - channelId
 *         - designationId
 *         - agentCode
 *         - joiningDate
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user associated with this agent
 *           example: "507f1f77bcf86cd799439010"
 *         channelId:
 *           type: string
 *           format: uuid
 *           description: ID of the channel the agent belongs to
 *           example: "507f1f77bcf86cd799439011"
 *         designationId:
 *           type: string
 *           format: uuid
 *           description: ID of the agent's designation
 *           example: "507f1f77bcf86cd799439012"
 *         agentCode:
 *           type: string
 *           maxLength: 10
 *           pattern: "^[A-Z0-9_]+$"
 *           description: Unique agent code (uppercase letters, numbers, and underscores only)
 *           example: "AGT12345"
 *         employeeId:
 *           type: string
 *           description: Employee ID of the agent (optional)
 *           example: "EMP12345"
 *         firstName:
 *           type: string
 *           description: First name of the agent
 *           example: "John"
 *         lastName:
 *           type: string
 *           description: Last name of the agent
 *           example: "Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the agent
 *           example: "john.doe@example.com"
 *         phoneNumber:
 *           type: string
 *           description: Phone number of the agent
 *           example: "+919876543210"
 *         agentStatus:
 *           type: string
 *           enum: [active, inactive, suspended]
 *           description: Status of the agent
 *           default: active
 *           example: "active"
 *         joiningDate:
 *           type: string
 *           format: date
 *           description: Date when agent joined
 *           example: "2023-01-01"
 *         targetAmount:
 *           type: number
 *           description: Target amount for the agent
 *           example: 10000
 *         commissionPercentage:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Commission percentage for the agent
 *           example: 10
 *         isTeamLead:
 *           type: boolean
 *           description: Whether the agent is a team lead
 *           default: false
 *           example: false
 *         teamLeadId:
 *           type: string
 *           format: uuid
 *           description: ID of the agent's team lead
 *           example: "507f1f77bcf86cd799439013"
 *         reportingManagerId:
 *           type: string
 *           format: uuid
 *           description: ID of the agent's reporting manager
 *           example: "507f1f77bcf86cd799439014"
 *
 *     AgentResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Agent's unique identifier
 *           example: "507f1f77bcf86cd799439011"
 *         channelId:
 *           type: string
 *           description: ID of the channel the agent belongs to
 *           example: "507f1f77bcf86cd799439022"
 *         channelName:
 *           type: string
 *           description: Name of the channel
 *           example: "Email Marketing"
 *         channelCode:
 *           type: string
 *           description: Code of the channel
 *           example: "EMAIL_MKT"
 *         designationId:
 *           type: string
 *           description: ID of the agent's designation
 *           example: "507f1f77bcf86cd799439033"
 *         designationName:
 *           type: string
 *           description: Name of the designation
 *           example: "Sales Executive"
 *         designationCode:
 *           type: string
 *           description: Code of the designation
 *           example: "SALES_EXEC"
 *         agentCode:
 *           type: string
 *           description: Unique agent code
 *           example: "AGT12345"
 *         employeeId:
 *           type: string
 *           description: Employee ID of the agent
 *           example: "EMP12345"
 *         firstName:
 *           type: string
 *           description: First name of the agent
 *           example: "John"
 *         middleName:
 *           type: string
 *           description: Middle name of the agent
 *           example: "Robert"
 *         lastName:
 *           type: string
 *           description: Last name of the agent
 *           example: "Doe"
 *         displayName:
 *           type: string
 *           description: Display name of the agent
 *           example: "John Doe"
 *         fullName:
 *           type: string
 *           description: Full name of the agent
 *           example: "John Robert Doe"
 *         email:
 *           type: string
 *           description: Email address of the agent
 *           example: "john.doe@example.com"
 *         phoneNumber:
 *           type: string
 *           description: Phone number of the agent
 *           example: "+919876543210"
 *         agentStatus:
 *           type: string
 *           enum: [active, inactive, suspended]
 *           description: Status of the agent
 *           example: "active"
 *         joiningDate:
 *           type: string
 *           format: date-time
 *           description: Date when agent joined
 *           example: "2023-01-01T00:00:00.000Z"
 *         targetAmount:
 *           type: number
 *           description: Target amount for the agent
 *           example: 10000
 *         commissionPercentage:
 *           type: number
 *           description: Commission percentage for the agent
 *           example: 10
 *         isTeamLead:
 *           type: boolean
 *           description: Whether the agent is a team lead
 *           example: false
 *         teamLeadId:
 *           type: string
 *           description: ID of the agent's team lead
 *           example: "507f1f77bcf86cd799439044"
 *         teamLeadName:
 *           type: string
 *           description: Name of the agent's team lead
 *           example: "Jane Smith"
 *         teamLeadCode:
 *           type: string
 *           description: Agent code of the team lead
 *           example: "AGT67890"
 *         reportingManagerId:
 *           type: string
 *           description: ID of the agent's reporting manager
 *           example: "507f1f77bcf86cd799439055"
 *         reportingManagerName:
 *           type: string
 *           description: Name of the agent's reporting manager
 *           example: "Michael Johnson"
 *         reportingManagerCode:
 *           type: string
 *           description: Agent code of the reporting manager
 *           example: "AGT24680"
 *         profilePictureUrl:
 *           type: string
 *           description: URL of the agent's profile picture
 *           example: "https://example.com/profile.jpg"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Agent creation timestamp
 *           example: "2023-01-01T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2023-01-15T10:30:00.000Z"
 *
 *     AgentListResponse:
 *       type: object
 *       properties:
 *         agents:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AgentResponse'
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
 *               description: Total number of agents
 *               example: 25
 *             totalPages:
 *               type: integer
 *               description: Total number of pages
 *               example: 3
 *
 *   tags:
 *     - name: Agents
 *       description: Agent management endpoints
 */

/**
 * @swagger
 * /api/agents:
 *   post:
 *     tags: [Agents]
 *     summary: Create a new agent
 *     description: Creates a new agent with the provided information. Agent code must be unique.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAgentRequest'
 *     responses:
 *       201:
 *         description: Agent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AgentResponse'
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
  ValidationPipe.validateBody(CreateAgentDto),
  agentController.createAgent,
);

/**
 * @swagger
 * /api/agents:
 *   get:
 *     tags: [Agents]
 *     summary: Get all agents with pagination
 *     description: Retrieves a paginated list of agents with optional status and channel filtering
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
 *           enum: [active, inactive, suspended]
 *         description: Filter agents by status
 *       - in: query
 *         name: channelId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter agents by channel ID
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
 *                       $ref: '#/components/schemas/AgentListResponse'
 *       400:
 *         description: Bad request - invalid query parameters
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
  '/',
  ValidationPipe.validateQuery(AgentQueryDto),
  agentController.getAllAgents,
);

/**
 * @swagger
 * /api/agents/active:
 *   get:
 *     tags: [Agents]
 *     summary: Get all active agents
 *     description: Retrieves a list of all active agents
 *     responses:
 *       200:
 *         description: Active agents retrieved successfully
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
 *                         $ref: '#/components/schemas/AgentResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/active', agentController.getActiveAgents);

/**
 * @swagger
 * /api/agents/channel/{channelId}:
 *   get:
 *     tags: [Agents]
 *     summary: Get agents by channel ID
 *     description: Retrieves a list of agents belonging to a specific channel
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the channel to get agents for
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
 *                         $ref: '#/components/schemas/AgentResponse'
 *       400:
 *         description: Bad request - invalid channel ID
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
router.get('/channel/:channelId', agentController.getAgentsByChannelId);

/**
 * @swagger
 * /api/agents/code/{code}:
 *   get:
 *     tags: [Agents]
 *     summary: Get agent by code
 *     description: Retrieves an agent by their unique code
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Code of the agent to retrieve
 *     responses:
 *       200:
 *         description: Agent retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AgentResponse'
 *       404:
 *         description: Agent not found
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
router.get('/code/:code', agentController.getAgentByCode);

/**
 * @swagger
 * /api/agents/user/{userId}:
 *   get:
 *     tags: [Agents]
 *     summary: Get agents by user ID
 *     description: Retrieves a list of agents belonging to a specific user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the user to get agents for
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
 *                         $ref: '#/components/schemas/AgentResponse'
 *       400:
 *         description: Bad request - invalid user ID
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
router.get('/user/:userId', agentController.getAgentsByUserId);

/**
 * @swagger
 * /api/agents/{id}:
 *   get:
 *     tags: [Agents]
 *     summary: Get agent by ID
 *     description: Retrieves an agent by their unique ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the agent to retrieve
 *     responses:
 *       200:
 *         description: Agent retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AgentResponse'
 *       404:
 *         description: Agent not found
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
router.get('/:id', agentController.getAgentById);

export default router;
