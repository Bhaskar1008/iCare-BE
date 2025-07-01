import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { leadController } from './lead.controller';
import { ValidationPipe } from '@/common/pipes/validation.pipe';
import { LeadCreatorQueryDto } from './dto/lead-query.dto';
import { authenticateJwt } from '@/middleware/auth.middleware';
import multer from 'multer';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';

const router: Router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       properties:
 *         addressLine1:
 *           type: string
 *           description: Primary address line
 *         addressLine2:
 *           type: string
 *           description: Secondary address line
 *         landmark:
 *           type: string
 *           description: Nearby landmark
 *         province:
 *           type: string
 *           description: Province/State
 *         city:
 *           type: string
 *           description: City name
 *         zipcode:
 *           type: string
 *           description: Postal/ZIP code
 *     LeadStatus:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Status ID
 *         name:
 *           type: string
 *           description: Status name
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         relationships:
 *           type: object
 *           properties:
 *             progress:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *             disposition:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *             subDisposition:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *     CreateLead:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - emailAddress
 *         - primaryNumber
 *         - leadType
 *         - stage
 *         - province
 *         - city
 *         - leadProgress
 *         - leadDisposition
 *         - leadSubDisposition
 *         - appointmentDate
 *         - allocatedBy
 *         - startTime
 *         - allocatedTo
 *         - createdBy
 *       properties:
 *         firstName:
 *           type: string
 *           description: First name of the lead
 *         lastName:
 *           type: string
 *           description: Last name of the lead
 *         emailAddress:
 *           type: string
 *           format: email
 *           description: Email address
 *         primaryNumber:
 *           type: string
 *           description: Primary contact number
 *         leadType:
 *           type: string
 *           description: Type of lead
 *         stage:
 *           type: string
 *           description: Current stage of the lead
 *         province:
 *           type: string
 *           description: Province/State
 *         city:
 *           type: string
 *           description: City name
 *         leadProgress:
 *           type: string
 *           description: Progress status of the lead
 *         leadDisposition:
 *           type: string
 *           description: Lead disposition
 *         leadSubDisposition:
 *           type: string
 *           description: Lead sub-disposition
 *         appointmentDate:
 *           type: string
 *           format: date-time
 *           description: Scheduled appointment date
 *         allocatedBy:
 *           type: string
 *           format: uuid
 *           description: Assigning user ID
 *         startTime:
 *           type: string
 *           description: Appointment start time (HH:mm)
 *         allocatedTo:
 *           type: string
 *           format: uuid
 *           description: Assigned user ID
 *         createdBy:
 *           type: string
 *           format: uuid
 *           description: Creator user ID
 *         projectId:
 *           type: string
 *           format: uuid
 *           description: Project ID for module configuration lookup
 *         moduleId:
 *           type: string
 *           format: uuid
 *           description: Module ID for configuration lookup
 *     BulkLeadUploadRequest:
 *       type: object
 *       required:
 *         - file
 *         - projectId
 *       properties:
 *         file:
 *           type: string
 *           format: binary
 *           description: Excel file (.xlsx, .xls, or .csv) containing lead data. Maximum size 5MB.
 *         projectId:
 *           type: string
 *           format: uuid
 *           description: ID of the project to associate leads with
 *
 *     BulkLeadExcelFormat:
 *       type: object
 *       description: |
 *         Excel file should contain the following columns:
 *
 *         Required Fields:
 *         - AGENT_ID (string): Valid agent ID from the Agent model
 *         - FIRST_NAME (string): First name of the lead
 *         - LAST_NAME (string): Last name of the lead
 *         - Province (string): Valid province name
 *         - CITY (string): Valid city name
 *         - EMAIL (string): Valid email address
 *         - CONTACT_NO (string): Valid contact number
 *         - LEAD_TYPE (string): Type of lead
 *         - LEAD_STAGE (string): Current stage of lead
 *         - leadProgress (string): Valid lead progress status
 *         - leadDisposition (string): Valid lead disposition
 *         - Lead Sub Disposition (string): Valid lead sub-disposition
 *
 *         Optional Fields:
 *         - REMARKS (string): Additional comments or notes
 *
 *         Validation Rules:
 *         - AGENT_ID: Must exist in the Agent model
 *         - EMAIL: Must be in valid email format
 *         - CONTACT_NO: Must be in valid phone number format
 *         - Province & CITY: Must be valid and exist in the system
 *         - leadProgress: Must be a valid progress status for the project
 *         - leadDisposition: Must be a valid disposition for the project
 *         - Lead Sub Disposition: Must be a valid sub-disposition for the project
 *
 *         Example Excel Format:
 *         | AGENT_ID | FIRST_NAME | LAST_NAME | Province | CITY | EMAIL | CONTACT_NO | LEAD_TYPE | LEAD_STAGE | REMARKS | leadProgress | leadDisposition | Lead Sub Disposition |
 *         |----------|------------|-----------|----------|------|-------|------------|-----------|------------|---------|--------------|-----------------|---------------------|
 *         | AGT001 | John | Doe | Province1 | City1 | john@example.com | +1234567890 | New | Initial | Sample remarks | In Progress | Interested | Will Buy |
 *
 *     BulkLeadUploadResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the upload was successful
 *           example: true
 *         message:
 *           type: string
 *           description: Status message
 *           example: "Leads processed successfully"
 *         data:
 *           type: object
 *           properties:
 *             totalProcessed:
 *               type: integer
 *               description: Total number of rows processed
 *               example: 5
 *             successCount:
 *               type: integer
 *               description: Number of leads successfully created
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
 *             createdLeads:
 *               type: array
 *               description: List of successfully created leads
 *               items:
 *                 type: object
 *                 properties:
 *                   leadId:
 *                     type: string
 *                     description: Generated lead ID
 *                     example: "LEAD001"
 *                   email:
 *                     type: string
 *                     description: Lead's email
 *                     example: "john.doe@example.com"
 *                   name:
 *                     type: string
 *                     description: Lead's full name
 *                     example: "John Doe"
 *                   status:
 *                     type: string
 *                     description: Lead's status
 *                     example: "New"
 */

/**
 * @swagger
 * tags:
 *   name: Leads
 *   description: Lead management endpoints
 */

/**
 * @swagger
 * /api/leads/search/filter:
 *   get:
 *     tags:
 *       - Leads
 *     summary: Get leads by filter with pagination
 *     parameters:
 *       - in: query
 *         name: filter
 *         required: true
 *         schema:
 *           type: string
 *           enum: [today, all, Open, Converted, Discarded, Failed]
 *           description: Filter leads by timeframe or status
 *       - in: query
 *         name: createdBy
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: MongoDB ObjectId of the agent to filter leads (matches leads where agent is either creator or allocator)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CreateLead'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       400:
 *         description: Bad Request
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
 *                   example: "Invalid createdBy: Must be a valid ObjectId"
 */
router.get('/search/filter', leadController.getFilteredLeads);

/**
 * @swagger
 * /api/leads/creator/{createdBy}:
 *   get:
 *     tags:
 *       - Leads
 *     summary: Get leads created by a specific user
 *     description: Retrieves all leads created by the specified user, sorted by creation date (newest first)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: createdBy
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: MongoDB ObjectId of the creator user
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
 *     responses:
 *       200:
 *         description: Success
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
 *                   example: "Leads retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CreateLead'
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *       400:
 *         description: Bad Request - Invalid creator ID
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
 *                   example: "Invalid creator ID format"
 *       404:
 *         description: Not Found - No leads found for this creator
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
 *                   example: "No leads found for this creator"
 *       401:
 *         description: Unauthorized - Authentication required
 */
router.get(
  '/creator/:createdBy',
  authenticateJwt,
  ValidationPipe.validateQuery(LeadCreatorQueryDto),
  leadController.getLeadsByCreator,
);

/**
 * @swagger
 * /api/leads/status/{userId}:
 *   get:
 *     tags:
 *       - Leads
 *     summary: Get leads by status
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/status/:userId', leadController.getLeadStatusCounts);

/**
 * @swagger
 * /api/leads/{id}/ownership:
 *   put:
 *     tags:
 *       - Leads
 *     summary: Change lead ownership
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - allocatedTo
 *               - allocatedBy
 *             properties:
 *               allocatedTo:
 *                 type: string
 *                 format: uuid
 *                 description: User ID of the new owner
 *               allocatedBy:
 *                 type: string
 *                 format: uuid
 *                 description: User ID of the person changing ownership
 *     responses:
 *       200:
 *         description: Ownership changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateLead'
 */
router.put('/:id/ownership', leadController.changeLeadOwnership);

/**
 * @swagger
 * /api/leads/{id}:
 *   get:
 *     tags:
 *       - Leads
 *     summary: Get lead by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateLead'
 */
router.get('/:id', leadController.getLead);

/**
 * @swagger
 * /api/leads:
 *   post:
 *     tags:
 *       - Leads
 *     summary: Create a new lead
 *     description: Creates a new lead with all details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLead'
 *     responses:
 *       201:
 *         description: Lead created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', leadController.createLead);

/**
 * @swagger
 * /api/leads/{id}:
 *   put:
 *     tags:
 *       - Leads
 *     summary: Update lead
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLead'
 *     responses:
 *       200:
 *         description: Updated successfully
 */
router.put('/:id', leadController.updateLead);

/**
 * @swagger
 * /api/leads/{id}/history:
 *   get:
 *     tags:
 *       - Leads
 *     summary: Get lead history
 *     description: Get the change history of a lead with pagination
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       oldValue:
 *                         type: object
 *                       newValue:
 *                         type: object
 *                       changedBy:
 *                         type: object
 *                         properties:
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *                       changeType:
 *                         type: string
 *                         enum: [CREATE, UPDATE, DELETE]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */
router.get('/:id/history', leadController.getLeadHistory);

/**
 * @swagger
 * /api/leads/{id}/status-count:
 *   get:
 *     tags:
 *       - Leads
 *     summary: Get lead status count
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 */
router.get('/:id/status-count', leadController.getStatusCount);

/**
 * @swagger
 * /api/leads/advanced/filter:
 *   get:
 *     tags:
 *       - Leads
 *     summary: Advanced lead filtering with multiple criteria
 *     description: Filter leads based on various criteria including sorting, search type, and lead attributes
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: ["Lead Created date - Newest to oldest", "Lead Created date - oldest to Newest"]
 *         description: Sort order for lead results
 *       - in: query
 *         name: searchType
 *         schema:
 *           type: string
 *           enum: ["Name", "Mobile", "Lead ID"]
 *         description: Type of search to perform
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Search term when searchType is Name
 *       - in: query
 *         name: mobileNo
 *         schema:
 *           type: string
 *         description: Search term when searchType is Mobile
 *       - in: query
 *         name: leadId
 *         schema:
 *           type: string
 *         description: Search term when searchType is Lead ID
 *       - in: query
 *         name: leadStatus
 *         schema:
 *           type: string
 *         description: Filter by lead status
 *       - in: query
 *         name: leadType
 *         schema:
 *           type: string
 *         description: Filter by lead type
 *       - in: query
 *         name: leadProgress
 *         schema:
 *           type: string
 *         description: Filter by lead progress
 *       - in: query
 *         name: leadDisposition
 *         schema:
 *           type: string
 *         description: Filter by lead disposition
 *       - in: query
 *         name: leadSubDisposition
 *         schema:
 *           type: string
 *         description: Filter by lead sub-disposition
 *       - in: query
 *         name: createdBy
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-f\d]{24}$'
 *         description: Filter by creator or allocated agent (MongoDB ObjectId, 24-character hex)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CreateLead'
 *                 total:
 *                   type: integer
 *                   description: Total number of records
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                 limit:
 *                   type: integer
 *                   description: Records per page
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *       400:
 *         description: Bad Request
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
 *                   example: "Invalid filter criteria"
 */
router.get('/advanced/filter', leadController.advancedFilter);

/**
 * @swagger
 * /api/leads/bulk-upload:
 *   post:
 *     summary: Upload multiple leads using Excel file
 *     description: |
 *       Bulk create leads from an Excel file. The file must follow the specified format with required and optional fields.
 *
 *       ### Excel File Format
 *
 *       #### Required Columns:
 *       | Column Name | Description | Format/Rules |
 *       |------------|-------------|--------------|
 *       | AGENT_ID | Valid agent ID | Must exist in Agent model |
 *       | FIRST_NAME | First name of lead | Text |
 *       | LAST_NAME | Last name of lead | Text |
 *       | Province | Province name | Must exist in system |
 *       | CITY | City name | Must exist in system |
 *       | EMAIL | Email address | Valid email format |
 *       | CONTACT_NO | Contact number | Valid phone number format |
 *       | LEAD_TYPE | Type of lead | Text |
 *       | LEAD_STAGE | Current stage | Text |
 *
 *       #### Optional Columns:
 *       | Column Name | Description | Format/Rules |
 *       |------------|-------------|--------------|
 *       | REMARKS | Additional notes | Text |
 *
 *       ### Validation Rules:
 *       - All required fields must be present and non-empty
 *       - AGENT_ID must exist in the Agent model
 *       - Email must be in valid format
 *       - Contact number must be in valid format
 *       - Province and City must exist in the system
 *       - leadProgress, leadDisposition, and Lead Sub Disposition must be valid for the project
 *
 *       ### Notes:
 *       - File must be Excel (.xlsx, .xls) or CSV
 *       - Maximum file size is 5MB
 *       - First row must be headers
 *       - Column names must match exactly
 *       - Empty rows will be skipped
 *       - Processing is done in batches
 *       - Detailed error reporting for failed rows
 *       - Source field will be automatically set to "excel"
 *     tags: [Leads]
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
 *                 description: Excel file (.xlsx, .xls, or .csv) containing lead data. Maximum size 5MB.
 *               projectId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the project to associate leads with
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
 *               $ref: '#/components/schemas/BulkLeadUploadResponse'
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
 *                   example: "Invalid file format. Only Excel/CSV files are allowed."
 *       413:
 *         description: File too large (max 5MB)
 *       500:
 *         description: Server error
 */

// Configure multer for Excel/CSV file uploads
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
      'text/csv',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel/CSV files are allowed.'));
    }
  },
});

router.post(
  '/bulk-upload',
  authenticateJwt,
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

      await leadController.bulkUpload(req, res);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
