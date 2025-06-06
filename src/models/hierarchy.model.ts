import type { Types } from 'mongoose';
import { Schema, model } from 'mongoose';
import {
  VALIDATION,
  HIERARCHY,
} from '@/common/constants/http-status.constants';
import type { IBaseModel } from './base.model';
import type { IChannel } from './channel.model';

export interface IHierarchy extends IBaseModel {
  channelId: Types.ObjectId | IChannel;
  hierarchyName: string;
  hierarchyLevelCode: string;
  hierarchyLevel: number;
  hierarchyParentId?: Types.ObjectId | IHierarchy;
  hierarchyDescription?: string;
  hierarchyOrder: number;
  hierarchyStatus: 'active' | 'inactive';
}

const hierarchySchema = new Schema<IHierarchy>(
  {
    channelId: {
      type: Schema.Types.ObjectId,
      ref: 'Channel',
      required: [true, 'Channel ID is required'],
      index: true,
    },
    hierarchyName: {
      type: String,
      required: [true, 'Hierarchy name is required'],
      trim: true,
      maxlength: [
        VALIDATION.MAX_NAME_LENGTH,
        `Hierarchy name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
      ],
    },
    hierarchyLevelCode: {
      type: String,
      required: [true, 'Level code is required'],
      uppercase: true,
      trim: true,
      maxlength: [
        VALIDATION.MAX_CODE_LENGTH,
        `Level code cannot exceed ${VALIDATION.MAX_CODE_LENGTH} characters`,
      ],
      match: [
        /^[A-Z0-9_]+$/,
        'Level code can only contain uppercase letters, numbers, and underscores',
      ],
    },
    hierarchyLevel: {
      type: Number,
      required: [true, 'Hierarchy level is required'],
      min: [
        HIERARCHY.MIN_LEVEL,
        `Hierarchy level must be at least ${HIERARCHY.MIN_LEVEL}`,
      ],
      max: [
        HIERARCHY.MAX_LEVEL,
        `Hierarchy level cannot exceed ${HIERARCHY.MAX_LEVEL}`,
      ],
    },
    hierarchyParentId: {
      type: Schema.Types.ObjectId,
      ref: 'Hierarchy',
      default: null,
      index: true,
    },
    hierarchyDescription: {
      type: String,
      trim: true,
      maxlength: [
        VALIDATION.MAX_DESCRIPTION_LENGTH,
        `Description cannot exceed ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters`,
      ],
    },
    hierarchyOrder: {
      type: Number,
      required: [true, 'Order is required'],
      min: [HIERARCHY.DEFAULT_ORDER, 'Order cannot be negative'],
      default: HIERARCHY.DEFAULT_ORDER,
    },
    hierarchyStatus: {
      type: String,
      required: [true, 'Hierarchy status is required'],
      enum: {
        values: ['active', 'inactive'],
        message: 'Status must be either active or inactive',
      },
      default: 'active',
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
    timestamps: true,
    collection: 'hierarchies',
  },
);

hierarchySchema.index({ channelId: 1, hierarchyLevel: 1 });
hierarchySchema.index({ channelId: 1, hierarchyParentId: 1 });
hierarchySchema.index(
  { channelId: 1, hierarchyLevelCode: 1 },
  { unique: true },
);
hierarchySchema.index({ hierarchyParentId: 1, hierarchyOrder: 1 });
hierarchySchema.index({ status: 1 });
hierarchySchema.index({ isDeleted: 1 });
hierarchySchema.index({ createdAt: -1 });

hierarchySchema.set('toJSON', { virtuals: true });
hierarchySchema.set('toObject', { virtuals: true });

export const HierarchyModel = model<IHierarchy>('Hierarchy', hierarchySchema);
