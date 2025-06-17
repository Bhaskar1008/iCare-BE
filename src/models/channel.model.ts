import type { Types } from 'mongoose';
import { Schema, model } from 'mongoose';
import { VALIDATION } from '@/common/constants/http-status.constants';
import type { IBaseModel } from './base.model';
import type { IProject } from './project.model';

export interface IChannel extends IBaseModel {
  channelName: string;
  channelCode: string;
  channelStatus: 'active' | 'inactive';
  projectId: Types.ObjectId | IProject;
}

const channelSchema = new Schema<IChannel>(
  {
    channelName: {
      type: String,
      required: [true, 'Channel name is required'],
      trim: true,
      maxlength: [
        VALIDATION.MAX_NAME_LENGTH,
        `Channel name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
      ],
    },
    channelCode: {
      type: String,
      required: [true, 'Channel code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [
        VALIDATION.MAX_CODE_LENGTH,
        `Channel code cannot exceed ${VALIDATION.MAX_CODE_LENGTH} characters`,
      ],
      match: [
        /^[A-Z0-9_]+$/,
        'Channel code can only contain uppercase letters, numbers, and underscores',
      ],
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
    },
    channelStatus: {
      type: String,
      required: [true, 'Channel status is required'],
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
    collection: 'channels',
  },
);

channelSchema.index({ channelName: 1 });
channelSchema.index({ channelCode: 1 }, { unique: true });
channelSchema.index({ projectId: 1 });
channelSchema.index({ channelStatus: 1 });
channelSchema.index({ isDeleted: 1 });
channelSchema.index({ createdAt: -1 });

channelSchema.set('toJSON', { virtuals: true });
channelSchema.set('toObject', { virtuals: true });

export const ChannelModel = model<IChannel>('Channel', channelSchema);
