import { Schema, model, Types } from 'mongoose';
import type { IBaseModel } from './base.model';

interface IFieldChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface ILeadHistory extends IBaseModel {
  leadId: Types.ObjectId;
  changeType: 'OWNERSHIP_CHANGE' | 'FIELD_UPDATE' | 'STATUS_CHANGE' | 'ALLOCATION_CHANGE';
  changedBy: Types.ObjectId;
  changes: IFieldChange[];
  timestamp: Date;
  remarks?: string;
}

const fieldChangeSchema = new Schema({
  field: {
    type: String,
    required: true
  },
  oldValue: {
    type: Schema.Types.Mixed,
    required: true
  },
  newValue: {
    type: Schema.Types.Mixed,
    required: true
  }
}, { _id: false });

const leadHistorySchema = new Schema<ILeadHistory>(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: true
    },
    changeType: {
      type: String,
      enum: ['OWNERSHIP_CHANGE', 'FIELD_UPDATE', 'STATUS_CHANGE', 'ALLOCATION_CHANGE'],
      required: true
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changes: {
      type: [fieldChangeSchema],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters']
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'leadHistory'
  }
);

// Indexes
leadHistorySchema.index({ leadId: 1 });
leadHistorySchema.index({ changedBy: 1 });
leadHistorySchema.index({ changeType: 1 });
leadHistorySchema.index({ timestamp: -1 });
leadHistorySchema.index({ createdAt: -1 });

export const LeadHistoryModel = model<ILeadHistory>('LeadHistory', leadHistorySchema); 