import { Schema, model, type Types } from 'mongoose';
import type { IBaseModel } from '@/models/base.model';

export type NotificationType =
  | 'lead_created'
  | 'lead_allocated'
  | 'lead_status_updated';
export type NotificationStatus = 'unread' | 'read' | 'archived';
export type RecipientType = 'user' | 'agent' | 'admin';

export interface INotificationRecipient {
  recipientId: Types.ObjectId;
  recipientType: RecipientType;
  status: NotificationStatus;
  readAt?: Date;
}

export interface INotification extends IBaseModel {
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    leadId?: Types.ObjectId;
    previousAllocatedTo?: Types.ObjectId;
    newAllocatedTo?: Types.ObjectId;
    allocatedBy?: Types.ObjectId;
    createdBy?: Types.ObjectId;
    projectId?: Types.ObjectId;
    moduleId?: Types.ObjectId;
    [key: string]: any;
  };
  recipients: INotificationRecipient[];
  triggeredBy: Types.ObjectId;
  triggeredByType: RecipientType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: Date;
  isGlobal: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

const notificationRecipientSchema = new Schema<INotificationRecipient>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'recipients.recipientType',
    },
    recipientType: {
      type: String,
      enum: ['user', 'agent', 'admin'],
      required: true,
    },
    status: {
      type: String,
      enum: ['unread', 'read', 'archived'],
      default: 'unread',
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false },
);

const notificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: ['lead_created', 'lead_allocated', 'lead_status_updated'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    recipients: [notificationRecipientSchema],
    triggeredBy: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'triggeredByType',
    },
    triggeredByType: {
      type: String,
      enum: ['user', 'agent', 'admin'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isGlobal: {
      type: Boolean,
      default: false,
    },
    actionUrl: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'notifications',
  },
);

// Indexes for efficient querying
notificationSchema.index({
  'recipients.recipientId': 1,
  'recipients.status': 1,
});
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ triggeredBy: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ createdAt: -1 });

// Virtual for unread count
notificationSchema.virtual('unreadCount').get(function () {
  return this.recipients.filter(r => r.status === 'unread').length;
});

notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

export const Notification = model<INotification>(
  'Notification',
  notificationSchema,
);
