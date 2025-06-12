import { Schema, model, type Types } from 'mongoose';
import type { IBaseModel } from './base.model';

export interface ILeadHistory extends IBaseModel {
  leadId: Types.ObjectId;
  field: string;
  oldValue: any;
  newValue: any;
  changedBy: Types.ObjectId;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE';
  remarks?: string;
}

const leadHistorySchema = new Schema<ILeadHistory>(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    field: {
      type: String,
      required: true,
    },
    oldValue: {
      type: Schema.Types.Mixed,
      required: false,
    },
    newValue: {
      type: Schema.Types.Mixed,
      required: true,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changeType: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'DELETE'],
      required: true,
    },
    remarks: String,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
leadHistorySchema.index({ leadId: 1, createdAt: -1 });
leadHistorySchema.index({ changedBy: 1, createdAt: -1 });
leadHistorySchema.index({ field: 1, createdAt: -1 });

export const LeadHistory = model<ILeadHistory>(
  'LeadHistory',
  leadHistorySchema,
);
