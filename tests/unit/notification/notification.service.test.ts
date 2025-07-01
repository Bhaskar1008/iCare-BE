import { Types } from 'mongoose';
import { NotificationService } from '@/modules/notification/notification.service';
import { Notification } from '@/models/notification.model';
import type {
  NotificationType,
  RecipientType,
} from '@/models/notification.model';
import type { CreateNotificationDto } from '@/modules/notification/interfaces/notification.interface';
import {
  setupTestDB,
  teardownTestDB,
  clearTestDB,
} from '../models/__tests__/setup';

// Mock the Notification model
jest.mock('@/models/notification.model');

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockNotification: jest.Mocked<typeof Notification>;

  beforeEach(async () => {
    jest.clearAllMocks();
    await clearTestDB();
    notificationService = new NotificationService();
    mockNotification = Notification as jest.Mocked<typeof Notification>;
  });

  describe('createNotification', () => {
    const mockNotificationData: CreateNotificationDto = {
      type: 'lead_created' as NotificationType,
      title: 'Test Notification',
      message: 'Test message',
      recipients: [
        {
          recipientId: new Types.ObjectId(),
          recipientType: 'agent' as RecipientType,
        },
      ],
      triggeredBy: new Types.ObjectId(),
      triggeredByType: 'admin' as RecipientType,
      priority: 'high' as const,
      data: { test: 'data' },
      actionUrl: '/test',
      isGlobal: false,
      metadata: { test: 'metadata' },
    };

    it('should create a notification successfully', async () => {
      const mockSavedNotification = {
        _id: new Types.ObjectId(),
        ...mockNotificationData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockModel = {
        save: jest.fn().mockResolvedValue(mockSavedNotification),
      };

      (mockNotification as unknown as jest.Mock).mockImplementation(
        () => mockModel,
      );

      const result =
        await notificationService.createNotification(mockNotificationData);

      expect(result).toEqual(mockSavedNotification);
      expect(mockModel.save).toHaveBeenCalled();
    });

    it('should handle errors during notification creation', async () => {
      const mockModel = {
        save: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (mockNotification as unknown as jest.Mock).mockImplementation(
        () => mockModel,
      );

      await expect(
        notificationService.createNotification(mockNotificationData),
      ).rejects.toThrow('Failed to create notification');
    });
  });

  describe('getNotifications', () => {
    const mockQuery = {
      recipientId: new Types.ObjectId().toString(),
      recipientType: 'agent' as RecipientType,
      page: 1,
      limit: 10,
    };

    const mockNotifications = [
      {
        _id: new Types.ObjectId(),
        type: 'lead_created',
        title: 'Test Notification',
        message: 'Test message',
        recipients: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should retrieve notifications successfully', async () => {
      const mockFindResult = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockNotifications),
      };

      mockNotification.find = jest.fn().mockReturnValue(mockFindResult);
      mockNotification.countDocuments = jest.fn().mockResolvedValue(1);

      const result = await notificationService.getNotifications(mockQuery);

      expect(result).toEqual({
        notifications: mockNotifications,
        total: 1,
        page: 1,
        totalPages: 1,
      });
    });

    it('should handle errors during notification retrieval', async () => {
      const mockFindResult = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      mockNotification.find = jest.fn().mockReturnValue(mockFindResult);
      mockNotification.countDocuments = jest.fn().mockResolvedValue(1);

      await expect(
        notificationService.getNotifications(mockQuery),
      ).rejects.toThrow('Failed to fetch notifications');
    });
  });

  describe('getNotificationById', () => {
    const mockId = new Types.ObjectId().toString();
    const mockNotificationData = {
      _id: new Types.ObjectId(mockId),
      type: 'lead_created',
      title: 'Test Notification',
      message: 'Test message',
      recipients: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should retrieve a notification by ID successfully', async () => {
      const mockFindByIdResult = {
        lean: jest.fn().mockResolvedValue(mockNotificationData),
      };

      mockNotification.findById = jest.fn().mockReturnValue(mockFindByIdResult);

      const result = await notificationService.getNotificationById(mockId);

      expect(result).toEqual(mockNotificationData);
    });

    it('should return null for non-existent notification', async () => {
      const mockFindByIdResult = {
        lean: jest.fn().mockResolvedValue(null),
      };

      mockNotification.findById = jest.fn().mockReturnValue(mockFindByIdResult);

      const result = await notificationService.getNotificationById(mockId);

      expect(result).toBeNull();
    });

    it('should handle errors during notification retrieval', async () => {
      const mockFindByIdResult = {
        lean: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      mockNotification.findById = jest.fn().mockReturnValue(mockFindByIdResult);

      await expect(
        notificationService.getNotificationById(mockId),
      ).rejects.toThrow('Failed to fetch notification');
    });
  });

  describe('updateNotificationStatus', () => {
    const mockId = new Types.ObjectId().toString();
    const mockUpdateData = {
      status: 'read' as const,
      recipientId: new Types.ObjectId(),
    };

    it('should update notification status successfully', async () => {
      const mockUpdatedNotification = {
        _id: new Types.ObjectId(mockId),
        type: 'lead_created',
        recipients: [
          { recipientId: mockUpdateData.recipientId, status: 'read' },
        ],
      };

      const mockFindOneAndUpdateResult = {
        lean: jest.fn().mockResolvedValue(mockUpdatedNotification),
      };

      mockNotification.findOneAndUpdate = jest
        .fn()
        .mockReturnValue(mockFindOneAndUpdateResult);

      const result = await notificationService.updateNotificationStatus(
        mockId,
        mockUpdateData,
      );

      expect(result).toEqual(mockUpdatedNotification);
    });

    it('should return null when notification not found', async () => {
      const mockFindOneAndUpdateResult = {
        lean: jest.fn().mockResolvedValue(null),
      };

      mockNotification.findOneAndUpdate = jest
        .fn()
        .mockReturnValue(mockFindOneAndUpdateResult);

      const result = await notificationService.updateNotificationStatus(
        mockId,
        mockUpdateData,
      );

      expect(result).toBeNull();
    });

    it('should handle errors during status update', async () => {
      const mockFindOneAndUpdateResult = {
        lean: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      mockNotification.findOneAndUpdate = jest
        .fn()
        .mockReturnValue(mockFindOneAndUpdateResult);

      await expect(
        notificationService.updateNotificationStatus(mockId, mockUpdateData),
      ).rejects.toThrow('Failed to update notification status');
    });
  });

  describe('markAllAsRead', () => {
    const mockRecipientId = new Types.ObjectId();
    const mockRecipientType = 'agent' as RecipientType;

    it('should mark all notifications as read successfully', async () => {
      mockNotification.updateMany = jest
        .fn()
        .mockResolvedValue({ modifiedCount: 5 });

      const result = await notificationService.markAllAsRead(
        mockRecipientId,
        mockRecipientType,
      );

      expect(result).toBe(5);
    });

    it('should handle errors during marking all as read', async () => {
      mockNotification.updateMany = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      await expect(
        notificationService.markAllAsRead(mockRecipientId, mockRecipientType),
      ).rejects.toThrow('Failed to mark all notifications as read');
    });
  });

  describe('getNotificationStats', () => {
    const mockRecipientId = new Types.ObjectId();
    const mockRecipientType = 'agent' as RecipientType;

    const mockStats = {
      total: 10,
      unread: 5,
      read: 3,
      archived: 2,
      byType: [
        'lead_created',
        'lead_created',
        'lead_created',
        'lead_created',
        'lead_allocated',
        'lead_allocated',
        'lead_allocated',
        'lead_allocated',
        'lead_allocated',
        'lead_allocated',
      ],
      byPriority: [
        'high',
        'high',
        'high',
        'medium',
        'medium',
        'medium',
        'medium',
        'medium',
        'low',
        'low',
      ],
    };

    it('should retrieve notification stats successfully', async () => {
      mockNotification.aggregate = jest.fn().mockResolvedValue([mockStats]);

      const result = await notificationService.getNotificationStats({
        recipientId: mockRecipientId,
        recipientType: mockRecipientType,
      });

      expect(result).toEqual({
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
      });
    });

    it('should handle errors during stats retrieval', async () => {
      mockNotification.aggregate = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      await expect(
        notificationService.getNotificationStats({
          recipientId: mockRecipientId,
          recipientType: mockRecipientType,
        }),
      ).rejects.toThrow('Failed to fetch notification stats');
    });
  });

  describe('cleanupExpiredNotifications', () => {
    it('should delete expired notifications successfully', async () => {
      mockNotification.deleteMany = jest
        .fn()
        .mockResolvedValue({ deletedCount: 5 });

      const result = await notificationService.cleanupExpiredNotifications();

      expect(result).toBe(5);
    });

    it('should handle errors during cleanup', async () => {
      mockNotification.deleteMany = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      await expect(
        notificationService.cleanupExpiredNotifications(),
      ).rejects.toThrow('Failed to cleanup expired notifications');
    });
  });
});
