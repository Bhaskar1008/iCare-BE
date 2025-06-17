import { Router } from 'express';
import { AuthController } from '@/modules/auth/auth.controller';
import {
  authenticateJwt,
  authenticateLocal,
} from '@/middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           description: User's password (min 8 characters)
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         role:
 *           type: string
 *           enum: [user, admin, superadmin]
 *           description: User's role
 *           default: user
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *
 *     AgentLoginRequest:
 *       type: object
 *       required:
 *         - agentCode
 *         - otpDeliveryMethod
 *       properties:
 *         agentCode:
 *           type: string
 *           description: Agent's unique code
 *         otpDeliveryMethod:
 *           type: string
 *           enum: [email, mobile, both]
 *           description: Method to deliver OTP
 *
 *     AgentOTPVerifyRequest:
 *       type: object
 *       required:
 *         - agentCode
 *         - otp
 *       properties:
 *         agentCode:
 *           type: string
 *           description: Agent's unique code
 *         otp:
 *           type: string
 *           description: 4-digit OTP received
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/UserResponse'
 *         accessToken:
 *           type: string
 *           description: JWT access token
 *         refreshToken:
 *           type: string
 *           description: JWT refresh token
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     description: Creates a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *         description: Bad request - Invalid input data
 *       409:
 *         description: Conflict - User already exists
 */
router.post('/register', async (req, res) => {
  await authController.register(req, res);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login user
 *     description: Authenticates a user and returns JWT tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Unauthorized - Invalid credentials
 */
router.post('/login', authenticateLocal, async (req, res) => {
  await authController.login(req, res);
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     description: Refreshes JWT access token using refresh token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Unauthorized - Invalid refresh token
 */
router.post('/refresh', async (req, res) => {
  await authController.refreshToken(req, res);
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout user
 *     description: Invalidates the refresh token and logs out the user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.post('/logout', authenticateJwt, async (req, res) => {
  await authController.logout(req, res);
});

/**
 * @swagger
 * /api/auth/agent/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Initiate agent login
 *     description: Initiates login for an agent using their agent code and sends OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AgentLoginRequest'
 *     responses:
 *       200:
 *         description: OTP sent successfully
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
 *                         agentCode:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phoneNumber:
 *                           type: string
 *                         message:
 *                           type: string
 *       400:
 *         description: Bad request - Missing required fields
 *       401:
 *         description: Unauthorized - Invalid agent code
 */
router.post('/agent/login', async (req, res) => {
  await authController.agentLogin(req, res);
});

/**
 * @swagger
 * /api/auth/agent/verify-otp:
 *   post:
 *     tags: [Authentication]
 *     summary: Verify agent OTP
 *     description: Verifies the OTP sent to the agent and completes the login process
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AgentOTPVerifyRequest'
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request - Missing required fields
 *       401:
 *         description: Unauthorized - Invalid OTP
 */
router.post('/agent/verify-otp', async (req, res) => {
  await authController.verifyAgentOTP(req, res);
});

export default router;
