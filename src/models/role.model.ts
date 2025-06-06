import type { Types } from 'mongoose';
import { Schema, model } from 'mongoose';
import type { IBaseModel } from './base.model';

const ROLE_NAME_MAX_LENGTH = 100;
const ROLE_CODE_MAX_LENGTH = 50;
const ROLE_DESCRIPTION_MAX_LENGTH = 500;

export interface IRole extends IBaseModel {
  channelId: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  permissions: Types.ObjectId[];
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
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
      maxlength: [
        ROLE_NAME_MAX_LENGTH,
        `Role name cannot exceed ${ROLE_NAME_MAX_LENGTH} characters`,
      ],
    },
    code: {
      type: String,
      required: [true, 'Role code is required'],
      trim: true,
      lowercase: true,
      maxlength: [
        ROLE_CODE_MAX_LENGTH,
        `Role code cannot exceed ${ROLE_CODE_MAX_LENGTH} characters`,
      ],
      match: [
        /^[a-z0-9_-]+$/,
        'Role code can only contain lowercase letters, numbers, underscores, and hyphens',
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [
        ROLE_DESCRIPTION_MAX_LENGTH,
        `Description cannot exceed ${ROLE_DESCRIPTION_MAX_LENGTH} characters`,
      ],
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Permission',
        index: true,
      },
    ],
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

roleSchema.index({ channelId: 1, code: 1 }, { unique: true });

roleSchema.index({ channelId: 1 });
roleSchema.index({ name: 1 });
roleSchema.index({ code: 1 });
roleSchema.index({ status: 1 });
roleSchema.index({ isDeleted: 1 });
roleSchema.index({ createdAt: -1 });

roleSchema.index({ channelId: 1, status: 1, isDeleted: 1 });

roleSchema.set('toJSON', { virtuals: true });
roleSchema.set('toObject', { virtuals: true });

export const RoleModel = model<IRole>('Role', roleSchema);
