import { Router } from 'express';
import { leadHistoryController } from './lead-history.controller';

const router = Router();

/**
 * @swagger
 * /api/lead-history/lead/{leadId}:
 *   get:
 *     tags: [Lead History]
 *     summary: Get history for a specific lead
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *         description: Lead ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Records per page
 *       - in: query
 *         name: changeType
 *         schema:
 *           type: string
 *           enum: [OWNERSHIP_CHANGE, FIELD_UPDATE, STATUS_CHANGE, ALLOCATION_CHANGE]
 *         description: Filter by change type
 *     responses:
 *       200:
 *         description: History records retrieved successfully
 *       400:
 *         description: Invalid lead ID
 *       500:
 *         description: Server error
 */
router.get('/lead/:leadId', leadHistoryController.getLeadHistory);

/**
 * @swagger
 * /api/lead-history/{id}:
 *   get:
 *     tags: [Lead History]
 *     summary: Get specific history record
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: History record ID
 *     responses:
 *       200:
 *         description: History record retrieved successfully
 *       400:
 *         description: Invalid history ID
 *       404:
 *         description: History record not found
 *       500:
 *         description: Server error
 */
router.get('/:id', leadHistoryController.getHistoryById);

/**
 * @swagger
 * /api/lead-history/lead/{leadId}/summary:
 *   get:
 *     tags: [Lead History]
 *     summary: Get history summary for a lead
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *         description: Lead ID
 *     responses:
 *       200:
 *         description: History summary retrieved successfully
 *       400:
 *         description: Invalid lead ID
 *       500:
 *         description: Server error
 */
router.get('/lead/:leadId/summary', leadHistoryController.getLeadHistorySummary);

export default router;