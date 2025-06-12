import { Router } from 'express';
import { ProvinceController } from './province.controller';

const router = Router();
const provinceController = new ProvinceController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Province:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The province ID
 *         name:
 *           type: string
 *           description: The name of the province
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The last update timestamp
 *
 *     City:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The city ID
 *         name:
 *           type: string
 *           description: The name of the city
 *         isCapital:
 *           type: boolean
 *           description: Whether this city is a capital
 *
 *     CitiesByProvince:
 *       type: object
 *       properties:
 *         cities:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/City'
 *         provinceName:
 *           type: string
 *           description: The name of the province
 */

/**
 * @swagger
 * /api/provinces:
 *   get:
 *     tags: [Provinces]
 *     summary: Get all provinces
 *     description: Retrieve a list of all provinces without their cities
 *     responses:
 *       200:
 *         description: A list of provinces
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Province'
 *                 message:
 *                   type: string
 *                   example: Provinces retrieved successfully
 */
router.get('/', provinceController.getAllProvinces);

/**
 * @swagger
 * /api/provinces/{provinceId}/cities:
 *   get:
 *     tags: [Provinces]
 *     summary: Get cities by province ID
 *     description: Retrieve a list of cities for a specific province
 *     parameters:
 *       - in: path
 *         name: provinceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the province
 *     responses:
 *       200:
 *         description: A list of cities in the province
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CitiesByProvince'
 *                 message:
 *                   type: string
 *                   example: Cities retrieved successfully
 *       404:
 *         description: Province not found
 */
router.get('/:provinceId/cities', provinceController.getCitiesByProvinceId);

export default router;
