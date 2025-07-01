import { Router } from 'express';
import { ResourceCenterMasterController } from './resource-center-master.controller';
import type { RequestHandler } from 'express';

const router = Router();
const resourceCenterMasterController = new ResourceCenterMasterController();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateResourceCenterMasterRequest:
 *       type: object
 *       required:
 *         - resourceCategoryName
 *         - sequence
 *       properties:
 *         resourceCategoryName:
 *           type: string
 *           maxLength: 100
 *           description: Name of the resource category
 *           example: "Sales Training"
 *         sequence:
 *           type: number
 *           minimum: 1
 *           description: Sequence number for ordering
 *           example: 1
 *         isActive:
 *           type: boolean
 *           default: false
 *           description: Whether the category is active
 *           example: true
 *
 *     UpdateResourceCenterMasterRequest:
 *       type: object
 *       properties:
 *         resourceCategoryName:
 *           type: string
 *           maxLength: 100
 *           description: Name of the resource category
 *           example: "Updated Sales Training"
 *         sequence:
 *           type: number
 *           minimum: 1
 *           description: Sequence number for ordering
 *           example: 2
 *         isActive:
 *           type: boolean
 *           description: Whether the category is active
 *           example: true
 *
 *     ResourceCenterMasterResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier
 *           example: "507f1f77bcf86cd799439011"
 *         resourceCategoryName:
 *           type: string
 *           description: Name of the resource category
 *           example: "Sales Training"
 *         sequence:
 *           type: number
 *           description: Sequence number for ordering
 *           example: 1
 *         isActive:
 *           type: boolean
 *           description: Whether the category is active
 *           example: true
 *         categoryId:
 *           type: string
 *           description: Unique category ID
 *           example: "RCMAS1234"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2023-12-01T10:30:00.000Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *           example: "2023-12-01T10:00:00.000Z"
 */

/**
 * @swagger
 * /api/resource-center-master:
 *   post:
 *     summary: Create a new resource center master category
 *     tags: [Resource Center Master]
 *     description: Creates a new resource center master category. The categoryId will be automatically generated in the format RCMAS followed by 4 random digits.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateResourceCenterMasterRequest'
 *     responses:
 *       201:
 *         description: Resource center master category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ResourceCenterMasterResponse'
 *       400:
 *         description: Bad request - Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  resourceCenterMasterController.createResourceCenterMaster.bind(
    resourceCenterMasterController,
  ) as unknown as RequestHandler,
);

/**
 * @swagger
 * /api/resource-center-master:
 *   get:
 *     summary: Get all resource center master categories
 *     tags: [Resource Center Master]
 *     description: Retrieves all resource center master categories sorted by creation date (newest first)
 *     responses:
 *       200:
 *         description: List of resource center master categories retrieved successfully
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
 *                         $ref: '#/components/schemas/ResourceCenterMasterResponse'
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  resourceCenterMasterController.getAllResourceCenterMasters.bind(
    resourceCenterMasterController,
  ) as unknown as RequestHandler,
);

/**
 * @swagger
 * /api/resource-center-master/{id}:
 *   put:
 *     summary: Update a resource center master category
 *     tags: [Resource Center Master]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource center master category ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateResourceCenterMasterRequest'
 *     responses:
 *       200:
 *         description: Resource center master category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ResourceCenterMasterResponse'
 *       400:
 *         description: Bad request - Invalid input data
 *       404:
 *         description: Not found - Resource center master category not found
 *       409:
 *         description: Conflict - Category ID already exists
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id',
  resourceCenterMasterController.updateResourceCenterMaster.bind(
    resourceCenterMasterController,
  ) as unknown as RequestHandler,
);

export default router;
