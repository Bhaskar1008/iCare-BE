import type { Types } from 'mongoose';
import { Schema, model } from 'mongoose';
import type { IBaseModel } from './base.model';

// Constants to replace magic numbers
const MAX_ROLE_NAME_LENGTH = 100;
const MIN_ROLE_CODE = 1;
const MAX_ROLE_CODE = 999999;
const MAX_DESCRIPTION_LENGTH = 500;

export interface IRole extends IBaseModel {
  channelId: Types.ObjectId;
  roleName: string;
  roleCode: number;
  description?: string;
  permissions: Types.ObjectId[];
  isSystem: boolean;
  status: 'active' | 'inactive';
}

const roleSchema = new Schema<IRole>(
  {
    channelId: {
      type: Schema.Types.ObjectId,
      ref: 'Channel',
      required: [true, 'Channel ID is required'],
      index: true,
    },
    roleName: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
      unique: true,
      maxlength: [
        MAX_ROLE_NAME_LENGTH,
        'Role name cannot exceed 100 characters',
      ],
    },
    roleCode: {
      type: Number,
      required: [true, 'Role code is required'],
      min: [MIN_ROLE_CODE, 'Role code must be positive'],
      max: [MAX_ROLE_CODE, 'Role code cannot exceed 999999'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [
        MAX_DESCRIPTION_LENGTH,
        'Description cannot exceed 500 characters',
      ],
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Permission',
      },
    ],
    isSystem: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['active', 'inactive'],
        message: 'Status must be active or inactive',
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
    collection: 'roles',
  },
);

roleSchema.index({ roleCode: 1 });
roleSchema.index({ status: 1 });
roleSchema.index({ isSystem: 1 });
roleSchema.index({ isDeleted: 1 });

roleSchema.set('toJSON', { virtuals: true });
roleSchema.set('toObject', { virtuals: true });

export const RoleModel = model<IRole>('Role', roleSchema);
