import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { NotificationService } from './notification.service';
import type { INotificationController } from './interfaces/notification.interface';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import logger from '@/common/utils/logger';
import type {
  RecipientType,
  NotificationType,
  NotificationStatus,
} from '@/models/notification.model';

// Constants for magic numbers
const DEFAULT_LIMIT = 10;

// Type definitions for request bodies
interface NotificationRecipient {
  recipientId: string;
  recipientType: RecipientType;
}

interface CreateNotificationRequestBody {
  type: NotificationType;
  title: string;
  message: string;
  recipients: NotificationRecipient[];
  triggeredBy: string;
  triggeredByType: RecipientType;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  data?: Record<string, unknown>;
  actionUrl?: string;
  expiresAt?: string;
  isGlobal?: boolean;
  metadata?: Record<string, unknown>;
}

interface NotificationQuery {
  recipientId?: string;
  recipientType?: RecipientType;
  type?: NotificationType;
  status?: NotificationStatus;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export class NotificationController implements INotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async createNotification(req: Request, res: Response): Promise<void> {
    try {
      const notificationData = req.body as CreateNotificationRequestBody;

      // Convert string IDs to ObjectIds
      const transformedData = {
        ...notificationData,
        triggeredBy: new Types.ObjectId(notificationData.triggeredBy),
        recipients: notificationData.recipients.map(recipient => ({
          ...recipient,
          recipientId: new Types.ObjectId(recipient.recipientId),
        })),
        expiresAt: notificationData.expiresAt
          ? new Date(notificationData.expiresAt)
          : undefined,
      };

      const notification =
        await this.notificationService.createNotification(transformedData);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Notification created successfully',
        data: notification,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error in createNotification controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to create notification',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query as unknown as NotificationQuery;

      // Convert string dates to Date objects if provided
      const processedQuery = {
        ...query,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      };

      const result =
        await this.notificationService.getNotifications(processedQuery);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: result.notifications,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit: query.limit ?? DEFAULT_LIMIT,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error in getNotifications controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to retrieve notifications',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getNotificationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid notification ID',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const notification =
        await this.notificationService.getNotificationById(id);

      if (!notification) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Notification not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Notification retrieved successfully',
        data: notification,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error in getNotificationById controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to retrieve notification',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async updateNotificationStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, recipientId } = req.body as {
        status: NotificationStatus;
        recipientId: string;
      };

      if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(recipientId)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid notification ID or recipient ID',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const notification =
        await this.notificationService.updateNotificationStatus(id, {
          status,
          recipientId: new Types.ObjectId(recipientId),
        });

      if (!notification) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message:
            'Notification not found or you are not authorized to update it',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Notification status updated successfully',
        data: notification,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error in updateNotificationStatus controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to update notification status',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { recipientId } = req.body as { recipientId: string };

      if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(recipientId)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid notification ID or recipient ID',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const notification = await this.notificationService.markAsRead(
        id,
        new Types.ObjectId(recipientId),
      );

      if (!notification) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message:
            'Notification not found or you are not authorized to mark it as read',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Notification marked as read successfully',
        data: notification,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error in markAsRead controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to mark notification as read',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { recipientId, recipientType } = req.body as {
        recipientId: string;
        recipientType: RecipientType;
      };

      if (!Types.ObjectId.isValid(recipientId)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid recipient ID',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const modifiedCount = await this.notificationService.markAllAsRead(
        new Types.ObjectId(recipientId),
        recipientType,
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'All notifications marked as read successfully',
        data: { modifiedCount },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error in markAllAsRead controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid notification ID',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const deleted = await this.notificationService.deleteNotification(id);

      if (!deleted) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Notification not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Notification deleted successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error in deleteNotification controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to delete notification',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getNotificationStats(req: Request, res: Response): Promise<void> {
    try {
      const { recipientId, recipientType } = req.query as {
        recipientId?: string;
        recipientType?: string;
      };

      if (!recipientId || !recipientType) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Valid recipient ID and recipient type are required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const stats = await this.notificationService.getNotificationStats({
        recipientId: new Types.ObjectId(recipientId),
        recipientType: recipientType as RecipientType,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Notification stats retrieved successfully',
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error in getNotificationStats controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to retrieve notification stats',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export const notificationController = new NotificationController();
