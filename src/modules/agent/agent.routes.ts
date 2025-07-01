import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { AgentController } from './agent.controller';
import { ValidationPipe } from '@/common/pipes/validation.pipe';
import { CreateAgentDto } from './dto/create-agent.dto';
import { AgentQueryDto } from './dto/agent-query.dto';
import multer from 'multer';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';

const router = Router();
const agentController = new AgentController();

// Configure multer for Excel file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel files are allowed.'));
    }
  },
});

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
 *         projectId:
 *           type: string
 *           format: uuid
 *           description: ID of the project the agent belongs to (optional)
 *           example: "507f1f77bcf86cd799439013"
 *         agentCode:
 *           type: string
 *           maxLength: 10
 *           pattern: "^[A-Z0-9_]+$"
 *           description: Unique agent code (uppercase letters, numbers, and underscores only). Required if generateAgentCode is not provided.
 *           example: "AGT12345"
 *         generateAgentCode:
 *           type: boolean
 *           description: Flag to automatically generate agent code based on project. Requires projectId to be provided.
 *           example: true
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
 *         projectId:
 *           type: string
 *           description: ID of the project the agent belongs to
 *           example: "507f1f77bcf86cd799439044"
 *         projectName:
 *           type: string
 *           description: Name of the project
 *           example: "Sales Project"
 *         projectCode:
 *           type: string
 *           description: Code of the project
 *           example: "SALES_PROJ"
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
 *     BulkAgentUploadRequest:
 *       type: object
 *       required:
 *         - file
 *         - projectId
 *       properties:
 *         file:
 *           type: string
 *           format: binary
 *           description: Excel file (.xlsx) containing agent data. Maximum size 5MB.
 *         projectId:
 *           type: string
 *           format: uuid
 *           description: ID of the project to associate agents with
 *
 *     BulkAgentExcelFormat:
 *       type: object
 *       description: |
 *         Excel file should contain the following columns:
 *
 *         Required Fields:
 *         - Agent First Name (string): First name of the agent
 *         - Agent Last Name (string): Last name of the agent
 *         - Email (string): Valid and unique email address
 *         - Mobile Number (string): Valid phone number format, starts with 9 or 0, and has 11 digits
 *         - Channel (string): Valid channel name or ID
 *         - Designation (string): Valid designation name or ID
 *
 *         Optional Fields:
 *         - Agent Code (string): Unique agent code (will be auto-generated if not provided)
 *         - Branch (string): Branch name or code
 *         - Appointment Date (date): Date in YYYY-MM-DD format
 *         - CA Number (string): CA registration number
 *         - Province (string): Valid province name
 *         - City (string): Valid city name
 *         - Pin Code (string): Postal/ZIP code
 *         - Status (string): Agent status (active/inactive/suspended)
 *         - Reporting Manager ID (string): Valid agent ID of reporting manager
 *         - TIN (string): Tax Identification Number
 *
 *         Validation Rules:
 *         - Email: Must be unique and valid email format
 *         - Mobile Number: Must be valid format (e.g., +1234567890)
 *         - Agent Code: Must be unique if provided
 *         - Channel: Must exist in the system
 *         - Designation: Must exist in the system
 *         - Province & City: Must be valid and exist in the system
 *         - Reporting Manager ID: Must be a valid existing agent
 *         - Status: Must be one of: active, inactive, suspended
 *         - Pin Code: Must be valid format for the country
 *
 *         Example Excel Format:
 *         | Agent First Name | Agent Last Name | Email | Mobile Number | Channel | Designation | Agent Code | Branch | Appointment Date | CA Number | Province | City | Pin Code | Status | Reporting Manager ID | TIN |
 *         |-----------------|-----------------|-------|---------------|---------|-------------|------------|--------|-----------------|-----------|----------|------|-----------|--------|---------------------|-----|
 *         | John | Doe | john.doe@example.com | +1234567890 | Channel1 | Manager | AGT001 | Main | 2025-01-01 | CA123 | Province1 | City1 | 12345 | active | MGR001 | TIN123 |
 *       properties: {}
 *
 *     BulkAgentUploadResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the upload was successful
 *           example: true
 *         message:
 *           type: string
 *           description: Status message
 *           example: "Agents processed successfully"
 *         data:
 *           type: object
 *           properties:
 *             totalProcessed:
 *               type: integer
 *               description: Total number of rows processed
 *               example: 5
 *             successCount:
 *               type: integer
 *               description: Number of agents successfully created
 *               example: 4
 *             failureCount:
 *               type: integer
 *               description: Number of rows that failed
 *               example: 1
 *             batchSize:
 *               type: integer
 *               description: Maximum number of rows processed in one batch
 *               example: 100
 *             errors:
 *               type: array
 *               description: Details of any errors encountered
 *               items:
 *                 type: object
 *                 properties:
 *                   row:
 *                     type: integer
 *                     description: Row number in Excel (1-based)
 *                     example: 3
 *                   error:
 *                     type: string
 *                     description: Error message
 *                     example: "Invalid email format"
 *                   field:
 *                     type: string
 *                     description: Field that caused the error
 *                     example: "Email"
 *                   data:
 *                     type: object
 *                     description: The row data that caused the error
 *             createdAgents:
 *               type: array
 *               description: List of successfully created agents
 *               items:
 *                 type: object
 *                 properties:
 *                   agentCode:
 *                     type: string
 *                     description: Generated or provided agent code
 *                     example: "AGT001"
 *                   email:
 *                     type: string
 *                     description: Agent's email
 *                     example: "john.doe@example.com"
 *                   name:
 *                     type: string
 *                     description: Agent's full name
 *                     example: "John Doe"
 *                   userId:
 *                     type: string
 *                     description: ID of the automatically created user
 *                     example: "507f1f77bcf86cd799439011"
 *                   status:
 *                     type: string
 *                     description: Agent's status
 *                     example: "active"
 *
 *   tags:
 *     - name: Agents
 *       description: Agent management endpoints
 */

/**
 * @swagger
 * /api/agents/bulk-upload:
 *   post:
 *     summary: Upload multiple agents using Excel file
 *     description: |
 *       Bulk create agents from an Excel file. The file must follow the specified format with required and optional fields.
 *
 *       ### Excel File Format
 *
 *       #### Required Columns:
 *       | Column Name | Description | Format/Rules |
 *       |------------|-------------|--------------|
 *       | Agent First Name | First name of the agent | Text |
 *       | Agent Last Name | Last name of the agent | Text |
 *       | Email | Email address | Valid email format |
 *       | Mobile Number | Contact number | Valid phone number format (e.g., +919876543210) |
 *       | Channel | Channel name or code | Must exist in the system and be mapped to the designation |
 *       | Designation | Designation name or code | Must exist in the system and be mapped to the channel |
 *
 *       #### Optional Columns:
 *       | Column Name | Description | Format/Rules |
 *       |------------|-------------|--------------|
 *       | Agent Code | Unique identifier | If not provided, will be auto-generated |
 *       | Appointment Date | Joining date | Excel date format |
 *       | CA Number | Employee/CA ID | Text |
 *       | Province | Province name | Must exist in the system |
 *       | City | City name | Must exist in the system |
 *       | Status | Agent status | One of: active, inactive, suspended (default: active) |
 *       | Reporting Manager ID | Agent code of reporting manager | Must be an existing agent code |
 *       | TIN | Tax Identification Number | Text |
 *
 *       ### Validation Rules:
 *       - All required fields must be present and non-empty
 *       - Email must be in valid format
 *       - Mobile number must be in valid format
 *       - Channel must exist and be mapped to the designation
 *       - Designation must exist and be mapped to the channel
 *       - Agent Code (if provided) must be unique
 *       - Reporting Manager (if provided) must exist
 *       - Status (if provided) must be one of the allowed values
 *
 *       ### Example Excel Row:
 *       ```
 *       | Agent First Name | Agent Last Name | Email | Mobile Number | Channel | Designation | Agent Code | Appointment Date | Status |
 *       |-----------------|-----------------|-------|---------------|---------|-------------|------------|-----------------|---------|
 *       | John | Doe | john.doe@example.com | +919876543210 | Sales | Manager | AGT001 | 2024-01-01 | active |
 *       ```
 *
 *       ### Notes:
 *       - File must be Excel (.xlsx)
 *       - Maximum file size is 5MB
 *       - First row must be headers
 *       - Column names must match exactly
 *       - Empty rows will be skipped
 *       - Processing is done in batches
 *       - Detailed error reporting for failed rows
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - projectId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file (.xlsx) containing agent data. Maximum size 5MB.
 *               projectId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the project to associate agents with
 *               batchSize:
 *                 type: integer
 *                 description: Optional. Number of rows to process in each batch (default 100, max 500)
 *                 minimum: 1
 *                 maximum: 500
 *                 example: 100
 *     responses:
 *       200:
 *         description: Upload processed successfully
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
 *                   example: "Bulk upload processed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProcessed:
 *                       type: integer
 *                       description: Total number of rows processed
 *                       example: 5
 *                     successCount:
 *                       type: integer
 *                       description: Number of agents successfully created
 *                       example: 4
 *                     failureCount:
 *                       type: integer
 *                       description: Number of rows that failed
 *                       example: 1
 *                     batchSize:
 *                       type: integer
 *                       description: Batch size used for processing
 *                       example: 100
 *                     errors:
 *                       type: array
 *                       description: Details of any errors encountered
 *                       items:
 *                         type: object
 *                         properties:
 *                           row:
 *                             type: integer
 *                             description: Row number in Excel (1-based)
 *                             example: 3
 *                           error:
 *                             type: string
 *                             description: Error message
 *                             example: "Invalid email format"
 *                           field:
 *                             type: string
 *                             description: Field that caused the error
 *                             example: "Email"
 *                           data:
 *                             type: object
 *                             description: The row data that caused the error
 *                     createdAgents:
 *                       type: array
 *                       description: List of successfully created agents
 *                       items:
 *                         type: object
 *                         properties:
 *                           agentCode:
 *                             type: string
 *                             description: Generated or provided agent code
 *                             example: "AGT001"
 *                           email:
 *                             type: string
 *                             description: Agent's email
 *                             example: "john.doe@example.com"
 *                           name:
 *                             type: string
 *                             description: Agent's full name
 *                             example: "John Doe"
 *                           userId:
 *                             type: string
 *                             description: Associated user ID
 *                             example: "507f1f77bcf86cd799439011"
 *                           status:
 *                             type: string
 *                             description: Agent's status
 *                             example: "active"
 *       400:
 *         description: Bad request - validation errors or invalid file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid file format. Only Excel files are allowed."
 *       413:
 *         description: File too large (max 5MB)
 *       500:
 *         description: Server error
 */
router.post(
  '/bulk-upload',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'No file uploaded',
        });
        return;
      }

      if (!req.body.projectId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Project ID is required',
        });
        return;
      }

      await agentController.bulkUpload(req, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /api/agents:
 *   post:
 *     tags: [Agents]
 *     summary: Create a new agent
 *     description: Creates a new agent with the provided information. Either provide an agent code manually or set generateAgentCode to true with a projectId to automatically generate a code.
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
 *     description: Retrieves a paginated list of agents with optional status, channel, user, and project filtering
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
 *           enum: [active, inactive, suspended]
 *         description: Filter agents by status
 *         example: "active"
 *       - in: query
 *         name: channelId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by channel ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by project ID
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
 * /api/agents/project/{projectId}:
 *   get:
 *     tags: [Agents]
 *     summary: Get agents by project ID
 *     description: Retrieves a list of agents belonging to a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the project to get agents for
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
 *         description: Bad request - invalid project ID
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
router.get('/project/:projectId', agentController.getAgentsByProjectId);

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
