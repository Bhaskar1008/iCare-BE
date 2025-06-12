import { Router } from 'express';
import { BusinessCommitmentController } from './business-commitment.controller';

const router = Router();
const controller = new BusinessCommitmentController();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateBusinessCommitmentRequest:
 *       type: object
 *       required:
 *         - agentId
 *         - commitmentDate
 *         - commitmentCount
 *       properties:
 *         agentId:
 *           type: string
 *           description: MongoDB ObjectId of the agent
 *           example: "507f1f77bcf86cd799439011"
 *         commitmentDate:
 *           type: string
 *           format: date
 *           description: Date for which the commitment is being made
 *           example: "2024-03-20"
 *         commitmentCount:
 *           type: number
 *           minimum: 0
 *           description: Number of commitments for the date
 *           example: 10
 *
 *     UpdateBusinessCommitmentRequest:
 *       type: object
 *       required:
 *         - achievedCount
 *       properties:
 *         achievedCount:
 *           type: number
 *           minimum: 0
 *           description: Number of achievements completed
 *           example: 8
 *
 *     UpdateCommitmentCountRequest:
 *       type: object
 *       required:
 *         - additionalCount
 *       properties:
 *         additionalCount:
 *           type: number
 *           minimum: 1
 *           description: Additional commitment count to add
 *           example: 5
 *
 *     BusinessCommitmentResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Commitment's unique identifier
 *           example: "507f1f77bcf86cd799439011"
 *         agentId:
 *           type: string
 *           description: Agent's unique identifier
 *           example: "507f1f77bcf86cd799439012"
 *         commitmentDate:
 *           type: string
 *           format: date
 *           description: Date of the commitment
 *           example: "2024-03-20"
 *         commitmentCount:
 *           type: number
 *           description: Total number of commitments
 *           example: 15
 *         achievedCount:
 *           type: number
 *           description: Number of achievements completed
 *           example: 8
 *         achievementPercentage:
 *           type: number
 *           description: Percentage of achievements completed
 *           example: 53.33
 *         createdBy:
 *           type: string
 *           description: Agent who created the commitment
 *           example: "507f1f77bcf86cd799439012"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *           example: "2024-03-20T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-03-20T15:45:00.000Z"
 *
 *   tags:
 *     - name: Business Commitments
 *       description: Business commitment management endpoints
 */

/**
 * @swagger
 * /api/business-commitments:
 *   post:
 *     tags: [Business Commitments]
 *     summary: Create a new business commitment
 *     description: Creates a new business commitment for an agent on a specific date. If a commitment already exists for that date, returns the existing commitment.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBusinessCommitmentRequest'
 *     responses:
 *       201:
 *         description: Commitment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusinessCommitmentResponse'
 *       409:
 *         description: Commitment already exists for this date
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "A commitment already exists for this date"
 *                 existingCommitment:
 *                   $ref: '#/components/schemas/BusinessCommitmentResponse'
 *       400:
 *         description: Bad request - validation errors
 */
router.post('/', (req, res) => controller.create(req, res));

/**
 * @swagger
 * /api/business-commitments/{id}/count:
 *   patch:
 *     tags: [Business Commitments]
 *     summary: Update commitment count
 *     description: Adds additional commitment count to an existing business commitment
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Business commitment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCommitmentCountRequest'
 *     responses:
 *       200:
 *         description: Commitment count updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusinessCommitmentResponse'
 *       400:
 *         description: Bad request - validation errors or commitment not found
 */
router.patch('/:id/count', (req, res) =>
  controller.updateCommitmentCount(req, res),
);

/**
 * @swagger
 * /api/business-commitments/{id}:
 *   patch:
 *     tags: [Business Commitments]
 *     summary: Update business commitment with achieved count
 *     description: Updates a business commitment with the achieved count and business ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Business commitment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBusinessCommitmentRequest'
 *     responses:
 *       200:
 *         description: Commitment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusinessCommitmentResponse'
 *       400:
 *         description: Bad request - validation errors or commitment not found
 */
router.patch('/:id', (req, res) => controller.update(req, res));

/**
 * @swagger
 * /api/business-commitments:
 *   get:
 *     tags: [Business Commitments]
 *     summary: Filter business commitments
 *     description: Retrieves business commitments based on agent ID and date range filters
 *     parameters:
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: string
 *         description: Filter by agent ID
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (inclusive)
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (inclusive)
 *     responses:
 *       200:
 *         description: Commitments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BusinessCommitmentResponse'
 *       400:
 *         description: Bad request - validation errors
 */
router.get('/', (req, res) => controller.filter(req, res));

export default router;
