import { Router } from 'express';
import { ProductCategoryController } from '@/modules/product-category/product-category.controller';
import { ValidationPipe } from '@/common/pipes/validation.pipe';
import { CreateProductCategoryDto } from '@/modules/product-category/dto/create-product-category.dto';
import { UpdateProductCategoryDto } from '@/modules/product-category/dto/update-product-category.dto';
import { ProductCategoryQueryDto } from '@/modules/product-category/dto/product-category-query.dto';

const router = Router();
const productCategoryController = new ProductCategoryController();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateProductCategoryRequest:
 *       type: object
 *       required:
 *         - categoryName
 *         - createdBy
 *       properties:
 *         categoryName:
 *           type: string
 *           maxLength: 50
 *           description: Product category name
 *           example: "Electronics"
 *         sequenceNumber:
 *           type: integer
 *           minimum: 0
 *           description: Sequence number for manual ordering
 *           default: 0
 *           example: 1
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Category status
 *           default: active
 *           example: "active"
 *         createdBy:
 *           type: string
 *           description: User ID who created the category
 *           example: "507f1f77bcf86cd799439011"
 *
 *     UpdateProductCategoryRequest:
 *       type: object
 *       properties:
 *         categoryName:
 *           type: string
 *           maxLength: 50
 *           description: Product category name
 *           example: "Electronics Updated"
 *         sequenceNumber:
 *           type: integer
 *           minimum: 0
 *           description: Sequence number for manual ordering
 *           example: 2
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Category status
 *           example: "inactive"
 *
 *     ProductCategoryResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Category's unique identifier
 *           example: "507f1f77bcf86cd799439011"
 *         categoryName:
 *           type: string
 *           description: Product category name
 *           example: "Electronics"
 *         sequenceNumber:
 *           type: integer
 *           description: Sequence number for manual ordering
 *           example: 1
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Category status
 *           example: "active"
 *         createdBy:
 *           type: string
 *           description: User ID who created the category
 *           example: "507f1f77bcf86cd799439011"
 *         createdByName:
 *           type: string
 *           description: Full name of the user who created the category
 *           example: "John Doe"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Category creation timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *
 *     ProductCategoryListResponse:
 *       type: object
 *       properties:
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductCategoryResponse'
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
 *               description: Total number of categories
 *               example: 25
 *             totalPages:
 *               type: integer
 *               description: Total number of pages
 *               example: 3
 *
 *   tags:
 *     - name: Product Categories
 *       description: Product category management endpoints
 */

/**
 * @swagger
 * /api/product-categories:
 *   post:
 *     tags: [Product Categories]
 *     summary: Create a new product category
 *     description: Creates a new product category with the provided information. Category name must be unique.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductCategoryRequest'
 *           example:
 *             categoryName: "Electronics"
 *             sequenceNumber: 1
 *             status: "active"
 *             createdBy: "507f1f77bcf86cd799439011"
 *     responses:
 *       201:
 *         description: Product category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ProductCategoryResponse'
 *             example:
 *               success: true
 *               message: "Product category created successfully"
 *               data:
 *                 _id: "507f1f77bcf86cd799439011"
 *                 categoryName: "Electronics"
 *                 sequenceNumber: 1
 *                 status: "active"
 *                 createdBy: "507f1f77bcf86cd799439011"
 *                 createdByName: "John Doe"
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
 *                   message: "Missing required fields: categoryName, createdBy"
 *                   timestamp: "2024-01-15T10:30:00.000Z"
 *               duplicate_name:
 *                 summary: Category name already exists
 *                 value:
 *                   success: false
 *                   message: "Product category with name 'Electronics' already exists"
 *                   timestamp: "2024-01-15T10:30:00.000Z"
 *               invalid_user:
 *                 summary: Invalid user ID
 *                 value:
 *                   success: false
 *                   message: "User not found or deleted"
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
  ValidationPipe.validateBody(CreateProductCategoryDto),
  productCategoryController.createProductCategory,
);

/**
 * @swagger
 * /api/product-categories:
 *   get:
 *     tags: [Product Categories]
 *     summary: Get all product categories with pagination
 *     description: Retrieves a paginated list of product categories with optional status filtering, ordered by sequence number. Includes creator information.
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
 *         description: Filter categories by status
 *         example: "active"
 *     responses:
 *       200:
 *         description: Product categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ProductCategoryListResponse'
 *             example:
 *               success: true
 *               message: "Product categories retrieved successfully"
 *               data:
 *                 categories:
 *                   - _id: "507f1f77bcf86cd799439011"
 *                     categoryName: "Electronics"
 *                     sequenceNumber: 1
 *                     status: "active"
 *                     createdBy: "507f1f77bcf86cd799439011"
 *                     createdByName: "John Doe"
 *                     createdAt: "2024-01-15T10:30:00.000Z"
 *                     updatedAt: "2024-01-15T10:30:00.000Z"
 *                   - _id: "507f1f77bcf86cd799439012"
 *                     categoryName: "Clothing"
 *                     sequenceNumber: 2
 *                     status: "active"
 *                     createdBy: "507f1f77bcf86cd799439012"
 *                     createdByName: "Jane Smith"
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
  ValidationPipe.validateQuery(ProductCategoryQueryDto),
  productCategoryController.getAllProductCategories,
);

/**
 * @swagger
 * /api/product-categories/active:
 *   get:
 *     tags: [Product Categories]
 *     summary: Get all active product categories
 *     description: Retrieves a list of all active product categories without pagination, ordered by sequence number. Includes creator information.
 *     responses:
 *       200:
 *         description: Active product categories retrieved successfully
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
 *                         $ref: '#/components/schemas/ProductCategoryResponse'
 *             example:
 *               success: true
 *               message: "Active product categories retrieved successfully"
 *               data:
 *                 - _id: "507f1f77bcf86cd799439011"
 *                   categoryName: "Electronics"
 *                   sequenceNumber: 1
 *                   status: "active"
 *                   createdBy: "507f1f77bcf86cd799439011"
 *                   createdByName: "John Doe"
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T10:30:00.000Z"
 *                 - _id: "507f1f77bcf86cd799439012"
 *                   categoryName: "Clothing"
 *                   sequenceNumber: 2
 *                   status: "active"
 *                   createdBy: "507f1f77bcf86cd799439012"
 *                   createdByName: "Jane Smith"
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
router.get('/active', productCategoryController.getActiveProductCategories);

/**
 * @swagger
 * /api/product-categories/{id}:
 *   get:
 *     tags: [Product Categories]
 *     summary: Get product category by ID
 *     description: Retrieves a specific product category by its unique identifier. Includes creator information.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product category's unique identifier (MongoDB ObjectId)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Product category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ProductCategoryResponse'
 *             example:
 *               success: true
 *               message: "Product category retrieved successfully"
 *               data:
 *                 _id: "507f1f77bcf86cd799439011"
 *                 categoryName: "Electronics"
 *                 sequenceNumber: 1
 *                 status: "active"
 *                 createdBy: "507f1f77bcf86cd799439011"
 *                 createdByName: "John Doe"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Bad request - invalid category ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Product category ID is required"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       404:
 *         description: Product category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Product category not found"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', productCategoryController.getProductCategoryById);

/**
 * @swagger
 * /api/product-categories/{id}:
 *   put:
 *     tags: [Product Categories]
 *     summary: Update product category
 *     description: Updates an existing product category with the provided information
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product category's unique identifier
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductCategoryRequest'
 *     responses:
 *       200:
 *         description: Product category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ProductCategoryResponse'
 *             example:
 *               success: true
 *               message: "Product category updated successfully"
 *               data:
 *                 _id: "507f1f77bcf86cd799439011"
 *                 categoryName: "Electronics Updated"
 *                 sequenceNumber: 2
 *                 status: "active"
 *                 createdBy: "507f1f77bcf86cd799439011"
 *                 createdByName: "John Doe"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:35:00.000Z"
 *               timestamp: "2024-01-15T10:35:00.000Z"
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product category not found
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
router.put(
  '/:id',
  ValidationPipe.validateBody(UpdateProductCategoryDto),
  productCategoryController.updateProductCategory,
);

/**
 * @swagger
 * /api/product-categories/{id}:
 *   delete:
 *     tags: [Product Categories]
 *     summary: Delete product category
 *     description: Soft deletes a product category by setting isDeleted flag to true
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product category's unique identifier
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Product category deleted successfully
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
 *             example:
 *               success: true
 *               message: "Product category deleted successfully"
 *               data:
 *                 deleted: true
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Bad request - invalid category ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product category not found
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
router.delete('/:id', productCategoryController.deleteProductCategory);

export default router;
