import type { Types } from 'mongoose';
import { Notification, type INotification } from '@/models/notification.model';
import type {
  INotificationService,
  CreateNotificationDto,
  UpdateNotificationStatusDto,
  NotificationQueryDto,
  NotificationStatsDto,
} from './interfaces/notification.interface';
import logger from '@/common/utils/logger';

// Constants for magic numbers
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

export class NotificationService implements INotificationService {
  async createNotification(
    data: CreateNotificationDto,
  ): Promise<INotification> {
    try {
      const notification = new Notification({
        type: data.type,
        title: data.title,
        message: data.message,
        recipients: data.recipients.map(recipient => ({
          recipientId: recipient.recipientId,
          recipientType: recipient.recipientType,
          status: 'unread',
        })),
        triggeredBy: data.triggeredBy,
        triggeredByType: data.triggeredByType,
        priority: data.priority ?? 'medium',
        data: data.data ?? {},
        actionUrl: data.actionUrl,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        isGlobal: data.isGlobal ?? false,
        metadata: data.metadata ?? {},
      });

      const savedNotification = await notification.save();
      logger.info('Notification created successfully', {
        notificationId: savedNotification._id.toString(),
        type: savedNotification.type,
        recipientCount: savedNotification.recipients.length,
      });

      return savedNotification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  async createLeadCreationNotification(leadData: {
    leadId: Types.ObjectId;
    leadName: string;
    createdBy: Types.ObjectId;
    allocatedTo?: Types.ObjectId;
    projectId?: Types.ObjectId;
  }): Promise<INotification> {
    const recipients = [];

    // Add the allocated agent as recipient if exists
    if (leadData.allocatedTo) {
      recipients.push({
        recipientId: leadData.allocatedTo,
        recipientType: 'agent' as const,
      });
    }

    // Add creator as recipient if different from allocated agent
    if (
      !leadData.allocatedTo ||
      leadData.createdBy.toString() !== leadData.allocatedTo.toString()
    ) {
      recipients.push({
        recipientId: leadData.createdBy,
        recipientType: 'agent' as const,
      });
    }

    const notificationData: CreateNotificationDto = {
      type: 'lead_created',
      title: 'New Lead Created',
      message: `A new lead "${leadData.leadName}" has been created${leadData.allocatedTo ? ' and assigned to you' : ''}.`,
      recipients,
      triggeredBy: leadData.createdBy,
      triggeredByType: 'agent',
      priority: leadData.allocatedTo ? 'high' : 'medium',
      data: {
        leadId: leadData.leadId,
        createdBy: leadData.createdBy,
        allocatedTo: leadData.allocatedTo,
        projectId: leadData.projectId,
      },
      actionUrl: `/leads/${leadData.leadId.toString()}`,
    };

    return this.createNotification(notificationData);
  }

  async createLeadAllocationNotification(leadData: {
    leadId: Types.ObjectId;
    leadName: string;
    previousAllocatedTo?: Types.ObjectId;
    newAllocatedTo: Types.ObjectId;
    allocatedBy: Types.ObjectId;
    projectId?: Types.ObjectId;
  }): Promise<INotification> {
    const recipients = [];

    // Add new allocated agent as recipient
    recipients.push({
      recipientId: leadData.newAllocatedTo,
      recipientType: 'agent' as const,
    });

    // Add previous allocated agent as recipient if exists and different
    if (
      leadData.previousAllocatedTo &&
      leadData.previousAllocatedTo.toString() !==
        leadData.newAllocatedTo.toString()
    ) {
      recipients.push({
        recipientId: leadData.previousAllocatedTo,
        recipientType: 'agent' as const,
      });
    }

    // Add allocator as recipient if different from new allocated agent
    if (
      leadData.allocatedBy.toString() !== leadData.newAllocatedTo.toString()
    ) {
      recipients.push({
        recipientId: leadData.allocatedBy,
        recipientType: 'agent' as const,
      });
    }

    const notificationData: CreateNotificationDto = {
      type: 'lead_allocated',
      title: 'Lead Allocation Update',
      message: `Lead "${leadData.leadName}" has been ${leadData.previousAllocatedTo ? 'reassigned' : 'assigned'} to you.`,
      recipients,
      triggeredBy: leadData.allocatedBy,
      triggeredByType: 'agent',
      priority: 'high',
      data: {
        leadId: leadData.leadId,
        previousAllocatedTo: leadData.previousAllocatedTo,
        newAllocatedTo: leadData.newAllocatedTo,
        allocatedBy: leadData.allocatedBy,
        projectId: leadData.projectId,
      },
      actionUrl: `/leads/${leadData.leadId.toString()}`,
    };

    return this.createNotification(notificationData);
  }

  async getNotifications(query: NotificationQueryDto): Promise<{
    notifications: INotification[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const page = query.page ?? DEFAULT_PAGE;
      const limit = query.limit ?? DEFAULT_LIMIT;
      const skip = (page - 1) * limit;
      const sortBy = query.sortBy ?? 'createdAt';
      const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

      // Build filter
      interface FilterQuery {
        recipients?: {
          $elemMatch: {
            recipientId: string;
            recipientType: string;
            status?: string;
          };
        };
        'recipients.$elemMatch.status'?: string;
        type?: string;
        priority?: string;
        createdAt?: {
          $gte?: Date;
          $lte?: Date;
        };
      }

      const filter: FilterQuery = {};

      if (query.recipientId && query.recipientType) {
        filter.recipients = {
          $elemMatch: {
            recipientId: query.recipientId,
            recipientType: query.recipientType,
          },
        };

        if (query.status) {
          if (filter.recipients?.$elemMatch) {
            filter.recipients.$elemMatch.status = query.status;
          }
        }
      }

      if (query.type) {
        filter.type = query.type;
      }

      if (query.priority) {
        filter.priority = query.priority;
      }

      if (query.startDate ?? query.endDate) {
        filter.createdAt = {};
        if (query.startDate) {
          filter.createdAt.$gte = new Date(query.startDate);
        }
        if (query.endDate) {
          filter.createdAt.$lte = new Date(query.endDate);
        }
      }

      // Get notifications without population first
      const [notifications, total] = await Promise.all([
        Notification.find(filter)
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        notifications: notifications as INotification[],
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  async getNotificationById(id: string): Promise<INotification | null> {
    try {
      const notification = await Notification.findById(id).lean();

      return notification as INotification | null;
    } catch (error) {
      logger.error('Error fetching notification by ID:', error);
      throw new Error('Failed to fetch notification');
    }
  }

  async updateNotificationStatus(
    notificationId: string,
    data: UpdateNotificationStatusDto,
  ): Promise<INotification | null> {
    try {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          'recipients.recipientId': data.recipientId,
        },
        {
          $set: {
            'recipients.$.status': data.status,
            'recipients.$.readAt': data.status === 'read' ? new Date() : null,
          },
        },
        { new: true },
      ).lean();

      if (!notification) {
        logger.warn('Notification not found or recipient not authorized', {
          notificationId,
          recipientId: data.recipientId,
        });
        return null;
      }

      logger.info('Notification status updated', {
        notificationId,
        recipientId: data.recipientId,
        status: data.status,
      });

      return notification as INotification;
    } catch (error) {
      logger.error('Error updating notification status:', error);
      throw new Error('Failed to update notification status');
    }
  }

  async markAsRead(
    notificationId: string,
    recipientId: Types.ObjectId,
  ): Promise<INotification | null> {
    return this.updateNotificationStatus(notificationId, {
      status: 'read',
      recipientId,
    });
  }

  async markAllAsRead(
    recipientId: Types.ObjectId,
    recipientType: string,
  ): Promise<number> {
    try {
      const result = await Notification.updateMany(
        {
          recipients: {
            $elemMatch: {
              recipientId,
              recipientType,
              status: 'unread',
            },
          },
        },
        {
          $set: {
            'recipients.$.status': 'read',
            'recipients.$.readAt': new Date(),
          },
        },
      );

      logger.info('Marked all notifications as read', {
        recipientId,
        recipientType,
        modifiedCount: result.modifiedCount,
      });

      return result.modifiedCount;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  async deleteNotification(id: string): Promise<boolean> {
    try {
      const result = await Notification.findByIdAndDelete(id);

      if (!result) {
        logger.warn('Notification not found for deletion', {
          notificationId: id,
        });
        return false;
      }

      logger.info('Notification deleted successfully', { notificationId: id });
      return true;
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  async getNotificationStats(data: NotificationStatsDto): Promise<{
    total: number;
    unread: number;
    read: number;
    archived: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    try {
      const pipeline = [
        {
          $match: {
            recipients: {
              $elemMatch: {
                recipientId: data.recipientId,
                recipientType: data.recipientType,
              },
            },
          },
        },
        {
          $unwind: '$recipients',
        },
        {
          $match: {
            'recipients.recipientId': data.recipientId,
            'recipients.recipientType': data.recipientType,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: {
              $sum: {
                $cond: [{ $eq: ['$recipients.status', 'unread'] }, 1, 0],
              },
            },
            read: {
              $sum: {
                $cond: [{ $eq: ['$recipients.status', 'read'] }, 1, 0],
              },
            },
            archived: {
              $sum: {
                $cond: [{ $eq: ['$recipients.status', 'archived'] }, 1, 0],
              },
            },
            byType: {
              $push: '$type',
            },
            byPriority: {
              $push: '$priority',
            },
          },
        },
      ];

      const result = await Notification.aggregate(pipeline);

      if (!result.length) {
        return {
          total: 0,
          unread: 0,
          read: 0,
          archived: 0,
          byType: {},
          byPriority: {},
        };
      }

      const stats = result[0];

      // Count by type
      const byType: Record<string, number> = {};
      stats.byType.forEach((type: string) => {
        byType[type] = (byType[type] || 0) + 1;
      });

      // Count by priority
      const byPriority: Record<string, number> = {};
      stats.byPriority.forEach((priority: string) => {
        byPriority[priority] = (byPriority[priority] || 0) + 1;
      });

      return {
        total: stats.total,
        unread: stats.unread,
        read: stats.read,
        archived: stats.archived,
        byType,
        byPriority,
      };
    } catch (error) {
      logger.error('Error fetching notification stats:', error);
      throw new Error('Failed to fetch notification stats');
    }
  }

  async cleanupExpiredNotifications(): Promise<number> {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: new Date() },
      });

      logger.info('Cleaned up expired notifications', {
        deletedCount: result.deletedCount,
      });

      return result.deletedCount;
    } catch (error) {
      logger.error('Error cleaning up expired notifications:', error);
      throw new Error('Failed to cleanup expired notifications');
    }
  }
}
