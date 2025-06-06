import { Router } from 'express';
import { UserController } from './user.controller';

const router = Router();
const userController = new UserController();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateUserRequest:
 *       type: object
 *       required:
 *         - email
 *         - firstName
 *         - lastName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: "john.doe@example.com"
 *         firstName:
 *           type: string
 *           maxLength: 50
 *           description: User's first name
 *           example: "John"
 *         lastName:
 *           type: string
 *           maxLength: 50
 *           description: User's last name
 *           example: "Doe"
 *         isActive:
 *           type: boolean
 *           description: Whether the user is active
 *           default: true
 *           example: true
 *
 *     UpdateUserRequest:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: "john.doe@example.com"
 *         firstName:
 *           type: string
 *           maxLength: 50
 *           description: User's first name
 *           example: "John"
 *         lastName:
 *           type: string
 *           maxLength: 50
 *           description: User's last name
 *           example: "Doe"
 *         isActive:
 *           type: boolean
 *           description: Whether the user is active
 *           example: true
 *
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: User's unique identifier
 *           example: "507f1f77bcf86cd799439011"
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: "john.doe@example.com"
 *         firstName:
 *           type: string
 *           description: User's first name
 *           example: "John"
 *         lastName:
 *           type: string
 *           description: User's last name
 *           example: "Doe"
 *         fullName:
 *           type: string
 *           description: User's full name
 *           example: "John Doe"
 *         isActive:
 *           type: boolean
 *           description: Whether the user is active
 *           example: true
 *         lastLoginAt:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: User creation timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *
 *     UserListResponse:
 *       type: object
 *       properties:
 *         users:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserResponse'
 *         total:
 *           type: integer
 *           description: Total number of users
 *           example: 100
 *         page:
 *           type: integer
 *           description: Current page number
 *           example: 1
 *         totalPages:
 *           type: integer
 *           description: Total number of pages
 *           example: 10
 *         limit:
 *           type: integer
 *           description: Number of items per page
 *           example: 10
 *
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the operation was successful
 *         message:
 *           type: string
 *           description: Response message
 *         data:
 *           type: object
 *           description: Response data
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Response timestamp
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           description: Error message
 *         error:
 *           type: string
 *           description: Detailed error (only in development)
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Error timestamp
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user
 *     description: Creates a new user with the provided information
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserResponse'
 *             example:
 *               success: true
 *               message: "User created successfully"
 *               data:
 *                 id: "507f1f77bcf86cd799439011"
 *                 email: "john.doe@example.com"
 *                 firstName: "John"
 *                 lastName: "Doe"
 *                 fullName: "John Doe"
 *                 isActive: true
 *                 lastLoginAt: null
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing required fields: email, firstName"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       409:
 *         description: Conflict - user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "User with this email already exists"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', async (req, res) => {
  await userController.createUser(req, res);
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users with pagination
 *     description: Retrieves a paginated list of users with optional filtering
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for firstName, lastName, or email
 *         example: "john"
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *         example: true
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserListResponse'
 *             example:
 *               success: true
 *               message: "Users retrieved successfully"
 *               data:
 *                 users:
 *                   - id: "507f1f77bcf86cd799439011"
 *                     email: "john.doe@example.com"
 *                     firstName: "John"
 *                     lastName: "Doe"
 *                     fullName: "John Doe"
 *                     isActive: true
 *                     lastLoginAt: "2024-01-15T10:30:00.000Z"
 *                     createdAt: "2024-01-15T10:30:00.000Z"
 *                     updatedAt: "2024-01-15T10:30:00.000Z"
 *                 total: 1
 *                 page: 1
 *                 totalPages: 1
 *                 limit: 10
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', async (req, res) => {
  await userController.getAllUsers(req, res);
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     description: Retrieves a specific user by their ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User's unique identifier
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserResponse'
 *             example:
 *               success: true
 *               message: "User retrieved successfully"
 *               data:
 *                 id: "507f1f77bcf86cd799439011"
 *                 email: "john.doe@example.com"
 *                 firstName: "John"
 *                 lastName: "Doe"
 *                 fullName: "John Doe"
 *                 isActive: true
 *                 lastLoginAt: "2024-01-15T10:30:00.000Z"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Bad request - invalid user ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "User not found"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', async (req, res) => {
  await userController.getUserById(req, res);
});

/**
 * @swagger
 * /api/users/email/{email}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by email
 *     description: Retrieves a specific user by their email address
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: User's email address
 *         example: "john.doe@example.com"
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Bad request - invalid email format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
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
router.get('/email/:email', async (req, res) => {
  await userController.getUserByEmail(req, res);
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user
 *     description: Updates an existing user with the provided information
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User's unique identifier
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserResponse'
 *             example:
 *               success: true
 *               message: "User updated successfully"
 *               data:
 *                 id: "507f1f77bcf86cd799439011"
 *                 email: "john.doe@example.com"
 *                 firstName: "John"
 *                 lastName: "Doe"
 *                 fullName: "John Doe"
 *                 isActive: true
 *                 lastLoginAt: "2024-01-15T10:30:00.000Z"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflict - email already taken
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
router.put('/:id', async (req, res) => {
  await userController.updateUser(req, res);
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user (soft delete)
 *     description: Soft deletes a user by setting isDeleted flag to true
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User's unique identifier
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *               message: "User deleted successfully"
 *               data:
 *                 deleted: true
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Bad request - invalid user ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
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
router.delete('/:id', async (req, res) => {
  await userController.deleteUser(req, res);
});

/**
 * @swagger
 * /api/users/{id}/restore:
 *   post:
 *     tags: [Users]
 *     summary: Restore deleted user
 *     description: Restores a previously soft-deleted user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User's unique identifier
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: User restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserResponse'
 *             example:
 *               success: true
 *               message: "User restored successfully"
 *               data:
 *                 id: "507f1f77bcf86cd799439011"
 *                 email: "john.doe@example.com"
 *                 firstName: "John"
 *                 lastName: "Doe"
 *                 fullName: "John Doe"
 *                 isActive: true
 *                 lastLoginAt: "2024-01-15T10:30:00.000Z"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Bad request - invalid user ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
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
router.post('/:id/restore', async (req, res) => {
  await userController.restoreUser(req, res);
});

/**
 * @swagger
 * /api/users/{id}/last-login:
 *   patch:
 *     tags: [Users]
 *     summary: Update user's last login timestamp
 *     description: Updates the last login timestamp for a user to the current time
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User's unique identifier
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Last login updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserResponse'
 *             example:
 *               success: true
 *               message: "Last login updated successfully"
 *               data:
 *                 id: "507f1f77bcf86cd799439011"
 *                 email: "john.doe@example.com"
 *                 firstName: "John"
 *                 lastName: "Doe"
 *                 fullName: "John Doe"
 *                 isActive: true
 *                 lastLoginAt: "2024-01-15T10:30:00.000Z"
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *               timestamp: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Bad request - invalid user ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
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
router.patch('/:id/last-login', async (req, res) => {
  await userController.updateLastLogin(req, res);
});

export default router;
