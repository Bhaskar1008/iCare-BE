import type { Types } from 'mongoose';
import type { Request, Response } from 'express';
import type {
  INotification,
  NotificationType,
  NotificationStatus,
  RecipientType,
} from '@/models/notification.model';

export interface CreateNotificationDto {
  type: NotificationType;
  title: string;
  message: string;
  recipients: Array<{
    recipientId: Types.ObjectId;
    recipientType: RecipientType;
  }>;
  triggeredBy: Types.ObjectId;
  triggeredByType: RecipientType;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  data?: Record<string, unknown>;
  actionUrl?: string;
  expiresAt?: Date;
  isGlobal?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateNotificationStatusDto {
  status: NotificationStatus;
  recipientId: Types.ObjectId;
}

export interface NotificationQueryDto {
  recipientId?: string;
  recipientType?: RecipientType;
  type?: NotificationType;
  status?: NotificationStatus;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
  startDate?: Date;
  endDate?: Date;
}

export interface NotificationStatsDto {
  recipientId: Types.ObjectId;
  recipientType: RecipientType;
}

export interface INotificationService {
  createNotification(data: CreateNotificationDto): Promise<INotification>;
  createLeadCreationNotification(leadData: {
    leadId: Types.ObjectId;
    leadName: string;
    createdBy: Types.ObjectId;
    allocatedTo?: Types.ObjectId;
    projectId?: Types.ObjectId;
  }): Promise<INotification>;
  createLeadAllocationNotification(leadData: {
    leadId: Types.ObjectId;
    leadName: string;
    previousAllocatedTo?: Types.ObjectId;
    newAllocatedTo: Types.ObjectId;
    allocatedBy: Types.ObjectId;
    projectId?: Types.ObjectId;
  }): Promise<INotification>;
  getNotifications(query: NotificationQueryDto): Promise<{
    notifications: INotification[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  getNotificationById(id: string): Promise<INotification | null>;
  updateNotificationStatus(
    notificationId: string,
    data: UpdateNotificationStatusDto,
  ): Promise<INotification | null>;
  markAsRead(
    notificationId: string,
    recipientId: Types.ObjectId,
  ): Promise<INotification | null>;
  markAllAsRead(
    recipientId: Types.ObjectId,
    recipientType: RecipientType,
  ): Promise<number>;
  deleteNotification(id: string): Promise<boolean>;
  getNotificationStats(data: NotificationStatsDto): Promise<{
    total: number;
    unread: number;
    read: number;
    archived: number;
    byType: Record<NotificationType, number>;
    byPriority: Record<string, number>;
  }>;
  cleanupExpiredNotifications(): Promise<number>;
}

export interface INotificationController {
  createNotification(req: Request, res: Response): Promise<void>;
  getNotifications(req: Request, res: Response): Promise<void>;
  getNotificationById(req: Request, res: Response): Promise<void>;
  updateNotificationStatus(req: Request, res: Response): Promise<void>;
  markAsRead(req: Request, res: Response): Promise<void>;
  markAllAsRead(req: Request, res: Response): Promise<void>;
  deleteNotification(req: Request, res: Response): Promise<void>;
  getNotificationStats(req: Request, res: Response): Promise<void>;
}
