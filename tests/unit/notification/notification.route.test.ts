import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { NotificationController } from '@/modules/notification/notification.controller';
import { NotificationService } from '@/modules/notification/notification.service';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import type {
  INotification,
  NotificationType,
  RecipientType,
  NotificationStatus,
} from '@/models/notification.model';

// Mock the NotificationService
jest.mock('@/modules/notification/notification.service');

describe('NotificationController', () => {
  let notificationController: NotificationController;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock response functions
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    // Setup mock request and response
    mockRequest = {};
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    // Initialize controller with mocked service
    mockNotificationService =
      new NotificationService() as jest.Mocked<NotificationService>;
    notificationController = new NotificationController();
    (notificationController as any).notificationService =
      mockNotificationService;
  });

  describe('createNotification', () => {
    const mockNotificationData = {
      type: 'lead_created' as NotificationType,
      title: 'New Lead Created',
      message: 'A new lead has been created',
      recipients: [
        {
          recipientId: new Types.ObjectId().toString(),
          recipientType: 'agent' as RecipientType,
        },
      ],
      triggeredBy: new Types.ObjectId().toString(),
      triggeredByType: 'admin' as RecipientType,
      priority: 'high',
      isGlobal: false,
    };

    it('should create a notification successfully', async () => {
      const mockCreatedNotification = {
        _id: new Types.ObjectId(),
        ...mockNotificationData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as INotification;

      mockRequest.body = mockNotificationData;
      mockNotificationService.createNotification.mockResolvedValue(
        mockCreatedNotification,
      );

      await notificationController.createNotification(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Notification created successfully',
          data: mockCreatedNotification,
        }),
      );
    });

    it('should handle errors during notification creation', async () => {
      mockRequest.body = mockNotificationData;
      const error = new Error('Database error');
      mockNotificationService.createNotification.mockRejectedValue(error);

      await notificationController.createNotification(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to create notification',
        }),
      );
    });
  });

  describe('getNotifications', () => {
    const mockQuery = {
      page: '1',
      limit: '10',
      recipientId: new Types.ObjectId().toString(),
      recipientType: 'agent' as RecipientType,
    };

    const mockNotifications = {
      notifications: [
        {
          _id: new Types.ObjectId(),
          type: 'lead_created' as NotificationType,
          title: 'Test Notification',
          message: 'Test Message',
          recipients: [],
          triggeredBy: new Types.ObjectId().toString(),
          triggeredByType: 'admin' as RecipientType,
          priority: 'high',
          isGlobal: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as INotification,
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    };

    it('should retrieve notifications successfully', async () => {
      mockRequest.query = mockQuery;
      mockNotificationService.getNotifications.mockResolvedValue(
        mockNotifications,
      );

      await notificationController.getNotifications(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Notifications retrieved successfully',
          data: mockNotifications.notifications,
        }),
      );
    });

    it('should handle errors during notification retrieval', async () => {
      mockRequest.query = mockQuery;
      const error = new Error('Database error');
      mockNotificationService.getNotifications.mockRejectedValue(error);

      await notificationController.getNotifications(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to retrieve notifications',
        }),
      );
    });
  });

  describe('getNotificationById', () => {
    const mockNotificationId = new Types.ObjectId().toString();
    const mockNotification = {
      _id: new Types.ObjectId(mockNotificationId),
      type: 'lead_created' as NotificationType,
      title: 'Test Notification',
      message: 'Test Message',
      recipients: [],
      triggeredBy: new Types.ObjectId().toString(),
      triggeredByType: 'admin' as RecipientType,
      priority: 'high',
      isGlobal: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as INotification;

    it('should retrieve a notification by ID successfully', async () => {
      mockRequest.params = { id: mockNotificationId };
      mockNotificationService.getNotificationById.mockResolvedValue(
        mockNotification,
      );

      await notificationController.getNotificationById(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Notification retrieved successfully',
          data: mockNotification,
        }),
      );
    });

    it('should handle invalid notification ID', async () => {
      mockRequest.params = { id: 'invalid-id' };

      await notificationController.getNotificationById(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid notification ID',
        }),
      );
    });

    it('should handle notification not found', async () => {
      mockRequest.params = { id: mockNotificationId };
      mockNotificationService.getNotificationById.mockResolvedValue(null);

      await notificationController.getNotificationById(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Notification not found',
        }),
      );
    });
  });

  describe('updateNotificationStatus', () => {
    const mockNotificationId = new Types.ObjectId().toString();
    const mockRecipientId = new Types.ObjectId().toString();
    const mockUpdateData = {
      status: 'read' as NotificationStatus,
      recipientId: mockRecipientId,
    };

    const mockUpdatedNotification = {
      _id: new Types.ObjectId(mockNotificationId),
      type: 'lead_created' as NotificationType,
      title: 'Test Notification',
      message: 'Test Message',
      recipients: [],
      triggeredBy: new Types.ObjectId().toString(),
      triggeredByType: 'admin' as RecipientType,
      priority: 'high',
      isGlobal: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as INotification;

    it('should update notification status successfully', async () => {
      mockRequest.params = { id: mockNotificationId };
      mockRequest.body = mockUpdateData;
      mockNotificationService.updateNotificationStatus.mockResolvedValue(
        mockUpdatedNotification,
      );

      await notificationController.updateNotificationStatus(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Notification status updated successfully',
        }),
      );
    });

    it('should handle invalid IDs', async () => {
      mockRequest.params = { id: 'invalid-id' };
      mockRequest.body = mockUpdateData;

      await notificationController.updateNotificationStatus(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid notification ID or recipient ID',
        }),
      );
    });
  });

  describe('markAsRead', () => {
    const mockNotificationId = new Types.ObjectId().toString();
    const mockRecipientId = new Types.ObjectId().toString();
    const mockReadNotification = {
      _id: new Types.ObjectId(mockNotificationId),
      type: 'lead_created' as NotificationType,
      title: 'Test Notification',
      message: 'Test Message',
      recipients: [],
      triggeredBy: new Types.ObjectId().toString(),
      triggeredByType: 'admin' as RecipientType,
      priority: 'high',
      isGlobal: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as INotification;

    it('should mark notification as read successfully', async () => {
      mockRequest.params = { id: mockNotificationId };
      mockRequest.body = { recipientId: mockRecipientId };
      mockNotificationService.markAsRead.mockResolvedValue(
        mockReadNotification,
      );

      await notificationController.markAsRead(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Notification marked as read successfully',
        }),
      );
    });
  });

  describe('markAllAsRead', () => {
    const mockRecipientId = new Types.ObjectId().toString();

    it('should mark all notifications as read successfully', async () => {
      mockRequest.body = { recipientId: mockRecipientId };
      mockNotificationService.markAllAsRead.mockResolvedValue(5);

      await notificationController.markAllAsRead(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'All notifications marked as read successfully',
        }),
      );
    });
  });

  describe('getNotificationStats', () => {
    const mockStats = {
      total: 10,
      unread: 5,
      read: 3,
      archived: 2,
      byType: {
        lead_created: 4,
        lead_allocated: 6,
      },
      byPriority: {
        high: 3,
        medium: 5,
        low: 2,
      },
    };

    it('should retrieve notification stats successfully', async () => {
      mockRequest.query = {
        recipientId: new Types.ObjectId().toString(),
        recipientType: 'agent',
      };
      mockNotificationService.getNotificationStats.mockResolvedValue(mockStats);

      await notificationController.getNotificationStats(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Notification stats retrieved successfully',
          data: mockStats,
        }),
      );
    });
  });
});
