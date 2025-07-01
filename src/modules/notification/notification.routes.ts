import { Router } from 'express';
import { notificationController } from './notification.controller';
import { ValidationPipe } from '@/common/pipes/validation.pipe';
import {
  CreateNotificationDto,
  NotificationQueryDto,
  UpdateNotificationStatusDto,
  MarkAsReadDto,
  MarkAllAsReadDto,
  NotificationStatsDto,
} from './dto/notification.dto';
import { authenticateJwt } from '@/middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationRecipient:
 *       type: object
 *       required:
 *         - recipientId
 *         - recipientType
 *       properties:
 *         recipientId:
 *           type: string
 *           description: MongoDB ObjectId of the recipient
 *         recipientType:
 *           type: string
 *           enum: [user, agent, admin]
 *           description: Type of recipient
 *         status:
 *           type: string
 *           enum: [unread, read, archived]
 *           description: Notification status for this recipient
 *         readAt:
 *           type: string
 *           format: date-time
 *           description: When the notification was read
 *
 *     CreateNotification:
 *       type: object
 *       required:
 *         - type
 *         - title
 *         - message
 *         - recipients
 *         - triggeredBy
 *         - triggeredByType
 *       properties:
 *         type:
 *           type: string
 *           enum: [lead_created, lead_allocated, lead_status_updated]
 *           description: Type of notification
 *         title:
 *           type: string
 *           maxLength: 200
 *           description: Notification title
 *         message:
 *           type: string
 *           maxLength: 1000
 *           description: Notification message
 *         recipients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/NotificationRecipient'
 *           minItems: 1
 *           description: List of notification recipients
 *         triggeredBy:
 *           type: string
 *           format: uuid
 *           description: ID of user who triggered the notification
 *         triggeredByType:
 *           type: string
 *           enum: [user, agent, admin]
 *           description: Type of user who triggered the notification
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           default: medium
 *           description: Notification priority
 *         data:
 *           type: object
 *           description: Additional notification data
 *         actionUrl:
 *           type: string
 *           description: URL for notification action
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: When the notification expires
 *         isGlobal:
 *           type: boolean
 *           default: false
 *           description: Whether notification is global
 *         metadata:
 *           type: object
 *           description: Additional metadata
 *
 *     NotificationResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Notification ID
 *         type:
 *           type: string
 *           enum: [lead_created, lead_allocated, lead_status_updated]
 *         title:
 *           type: string
 *         message:
 *           type: string
 *         recipients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/NotificationRecipient'
 *         triggeredBy:
 *           type: object
 *           description: User who triggered the notification
 *         triggeredByType:
 *           type: string
 *           enum: [user, agent, admin]
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         data:
 *           type: object
 *         actionUrl:
 *           type: string
 *         isGlobal:
 *           type: boolean
 *         expiresAt:
 *           type: string
 *           format: date-time
 *         metadata:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         unreadCount:
 *           type: number
 *           description: Number of unread recipients
 *
 *     NotificationStats:
 *       type: object
 *       properties:
 *         total:
 *           type: number
 *           description: Total notifications
 *         unread:
 *           type: number
 *           description: Unread notifications
 *         read:
 *           type: number
 *           description: Read notifications
 *         archived:
 *           type: number
 *           description: Archived notifications
 *         byType:
 *           type: object
 *           description: Notifications count by type
 *         byPriority:
 *           type: object
 *           description: Notifications count by priority
 */

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management endpoints
 */

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     tags: [Notifications]
 *     summary: Create a new notification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNotification'
 *     responses:
 *       201:
 *         description: Notification created successfully
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
 *                   example: "Notification created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/NotificationResponse'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  authenticateJwt,
  ValidationPipe.validateBody(CreateNotificationDto),
  notificationController.createNotification.bind(notificationController),
);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notifications with filtering and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: recipientId
 *         schema:
 *           type: string
 *         description: Filter by recipient ID
 *       - in: query
 *         name: recipientType
 *         schema:
 *           type: string
 *           enum: [user, agent, admin]
 *         description: Filter by recipient type
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [lead_created, lead_allocated, lead_status_updated]
 *         description: Filter by notification type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [unread, read, archived]
 *         description: Filter by notification status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, priority]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter from date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter to date
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
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
 *                   example: "Notifications retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NotificationResponse'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     page:
 *                       type: number
 *                     totalPages:
 *                       type: number
 *                     limit:
 *                       type: number
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  //   authenticateJwt,
  ValidationPipe.validateQuery(NotificationQueryDto),
  notificationController.getNotifications.bind(notificationController),
);

/**
 * @swagger
 * /api/notifications/stats:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notification statistics for a recipient
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: recipientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Recipient ID
 *       - in: query
 *         name: recipientType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [user, agent, admin]
 *         description: Recipient type
 *     responses:
 *       200:
 *         description: Notification stats retrieved successfully
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
 *                   example: "Notification stats retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/NotificationStats'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/stats',
  // authenticateJwt,
  ValidationPipe.validateQuery(NotificationStatsDto),
  notificationController.getNotificationStats.bind(notificationController),
);

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notification by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification retrieved successfully
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
 *                   example: "Notification retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/NotificationResponse'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid notification ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id',
  authenticateJwt,
  notificationController.getNotificationById.bind(notificationController),
);

/**
 * @swagger
 * /api/notifications/{id}/status:
 *   patch:
 *     tags: [Notifications]
 *     summary: Update notification status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *               - recipientId
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [unread, read, archived]
 *                 description: New notification status
 *               recipientId:
 *                 type: string
 *                 description: Recipient ID
 *     responses:
 *       200:
 *         description: Notification status updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/:id/status',
  authenticateJwt,
  ValidationPipe.validateBody(UpdateNotificationStatusDto),
  notificationController.updateNotificationStatus.bind(notificationController),
);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *             properties:
 *               recipientId:
 *                 type: string
 *                 description: Recipient ID
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/:id/read',
  //   authenticateJwt,
  ValidationPipe.validateBody(MarkAsReadDto),
  notificationController.markAsRead.bind(notificationController),
);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read for a recipient
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - recipientType
 *             properties:
 *               recipientId:
 *                 type: string
 *                 description: Recipient ID
 *               recipientType:
 *                 type: string
 *                 enum: [user, agent, admin]
 *                 description: Recipient type
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
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
 *                   example: "5 notifications marked as read successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     modifiedCount:
 *                       type: number
 *                       example: 5
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/read-all',
  authenticateJwt,
  ValidationPipe.validateBody(MarkAllAsReadDto),
  notificationController.markAllAsRead.bind(notificationController),
);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete a notification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
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
 *                   example: "Notification deleted successfully"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid notification ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:id',
  authenticateJwt,
  notificationController.deleteNotification.bind(notificationController),
);

export default router;
