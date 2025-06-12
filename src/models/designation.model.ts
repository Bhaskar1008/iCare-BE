import type { Types } from 'mongoose';
import { Schema, model } from 'mongoose';
import { VALIDATION } from '@/common/constants/http-status.constants';
import type { IBaseModel } from './base.model';
import type { IChannel } from './channel.model';
import type { IRole } from './role.model';
import type { IHierarchy } from './hierarchy.model';

export interface IDesignation extends IBaseModel {
  channelId: Types.ObjectId | IChannel;
  roleId: Types.ObjectId | IRole;
  hierarchyId: Types.ObjectId | IHierarchy;
  designationName: string;
  designationCode: string;
  designationStatus: 'active' | 'inactive';
  designationDescription?: string;
  designationOrder: number;
}

const designationSchema = new Schema<IDesignation>(
  {
    channelId: {
      type: Schema.Types.ObjectId,
      ref: 'Channel',
      required: [true, 'Channel ID is required'],
      index: true,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: [true, 'Role ID is required'],
      index: true,
    },
    hierarchyId: {
      type: Schema.Types.ObjectId,
      ref: 'Hierarchy',
      required: [true, 'Hierarchy ID is required'],
      index: true,
    },
    designationName: {
      type: String,
      required: [true, 'Designation name is required'],
      trim: true,
      maxlength: [
        VALIDATION.MAX_NAME_LENGTH,
        `Designation name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
      ],
    },
    designationCode: {
      type: String,
      required: [true, 'Designation code is required'],
      uppercase: true,
      trim: true,
      maxlength: [
        VALIDATION.MAX_CODE_LENGTH,
        `Designation code cannot exceed ${VALIDATION.MAX_CODE_LENGTH} characters`,
      ],
      match: [
        /^[A-Z0-9_]+$/,
        'Designation code can only contain uppercase letters, numbers, and underscores',
      ],
    },
    designationStatus: {
      type: String,
      required: [true, 'Designation status is required'],
      enum: {
        values: ['active', 'inactive'],
        message: 'Status must be either active or inactive',
      },
      default: 'active',
    },
    designationDescription: {
      type: String,
      trim: true,
      maxlength: [
        VALIDATION.MAX_DESCRIPTION_LENGTH,
        `Designation description cannot exceed ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters`,
      ],
    },
    designationOrder: {
      type: Number,
      required: [true, 'Designation order is required'],
      min: [0, 'Designation order cannot be negative'],
      default: 0,
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
    collection: 'designations',
  },
);

designationSchema.index({ channelId: 1, designationCode: 1 }, { unique: true });

designationSchema.index({ channelId: 1, roleId: 1, hierarchyId: 1 });
designationSchema.index({ channelId: 1, hierarchyId: 1 });
designationSchema.index({ channelId: 1, roleId: 1 });
designationSchema.index({ roleId: 1, hierarchyId: 1 });

designationSchema.index({ designationName: 1 });
designationSchema.index({ designationCode: 1 });
designationSchema.index({ designationStatus: 1 });
designationSchema.index({ isDeleted: 1 });
designationSchema.index({ createdAt: -1 });

designationSchema.index({ channelId: 1, designationStatus: 1, isDeleted: 1 });

designationSchema.index({ hierarchyId: 1, designationOrder: 1 });

designationSchema.set('toJSON', { virtuals: true });
designationSchema.set('toObject', { virtuals: true });

export const DesignationModel = model<IDesignation>(
  'Designation',
  designationSchema,
);
