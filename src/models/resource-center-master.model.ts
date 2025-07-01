import type { Types, Document } from 'mongoose';
import { Schema, model } from 'mongoose';

export interface IResourceCenterMaster extends Document {
  _id: string;
  resourceCategoryName: string;
  sequence: number;
  isActive: boolean;
  categoryId: string;
  updatedBy?: Types.ObjectId;
  updatedAt?: Date;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
}

const resourceCenterMasterSchema = new Schema<IResourceCenterMaster>(
  {
    resourceCategoryName: {
      type: String,
      required: [true, 'Resource category name is required'],
      trim: true,
      maxlength: [100, 'Resource category name cannot exceed 100 characters'],
    },
    sequence: {
      type: Number,
      required: [true, 'Sequence is required'],
      min: [1, 'Sequence must be a positive number'],
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    categoryId: {
      type: String,
      required: [true, 'Category ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [
        /^RCMAS\d{4}$/,
        'Category ID must start with RCMAS followed by 4 digits',
      ],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    updatedAt: {
      type: Date,
      required: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
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
    timestamps: false, // We'll handle timestamps manually
    collection: 'resourceCenterMaster',
  },
);

// Indexes
resourceCenterMasterSchema.index({ categoryId: 1 }, { unique: true });
resourceCenterMasterSchema.index({ sequence: 1 });
resourceCenterMasterSchema.index({ isActive: 1 });
resourceCenterMasterSchema.index({ isDeleted: 1 });
resourceCenterMasterSchema.index({ createdAt: -1 });

resourceCenterMasterSchema.set('toJSON', { virtuals: true });
resourceCenterMasterSchema.set('toObject', { virtuals: true });

export const ResourceCenterMasterModel = model<IResourceCenterMaster>(
  'ResourceCenterMaster',
  resourceCenterMasterSchema,
);
