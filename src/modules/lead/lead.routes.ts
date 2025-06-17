import { Router } from 'express';
import { leadController } from './lead.controller';

const router: Router = Router();

/**
 * @openapi
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
 */

/**
 * @openapi
 * tags:
 *   name: Leads
 *   description: Lead management endpoints
 */

/**
 * @openapi
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
 * @openapi
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
 * @openapi
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
 * @openapi
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
 * @openapi
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
 * @openapi
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
 * @openapi
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
 * @openapi
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
 * @openapi
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

export default router;
