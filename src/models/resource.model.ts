import type { Types } from 'mongoose';
import { Schema, model } from 'mongoose';
import type { IBaseModel } from './base.model';

// Constants to replace magic numbers
const MAX_RESOURCE_NAME_LENGTH = 100;
const MAX_RESOURCE_IDENTIFIER_LENGTH = 100;

export interface IResource extends IBaseModel {
  name: string; // Human readable name: "User Management", "Dashboard"
  identifier: string; // Unique identifier: "users", "dashboard.analytics"
  type: 'module' | 'api' | 'page' | 'ui' | 'feature'; // Clear categorization
  parentId?: Types.ObjectId; // Parent resource for hierarchy
  status: 'active' | 'inactive';
}

const resourceSchema = new Schema<IResource>(
  {
    name: {
      type: String,
      required: [true, 'Resource name is required'],
      trim: true,
      maxlength: [
        MAX_RESOURCE_NAME_LENGTH,
        'Resource name cannot exceed 100 characters',
      ],
    },
    identifier: {
      type: String,
      required: [true, 'Resource identifier is required'],
      trim: true,
      unique: true,
      lowercase: true,
      maxlength: [
        MAX_RESOURCE_IDENTIFIER_LENGTH,
        'Resource identifier cannot exceed 100 characters',
      ],
      match: [
        /^[a-z][a-z0-9._-]*$/,
        'Identifier must start with a letter and contain only lowercase letters, numbers, dots, underscores, and hyphens',
      ],
    },
    type: {
      type: String,
      required: [true, 'Resource type is required'],
      enum: {
        values: ['module', 'api', 'page', 'ui', 'feature'],
        message: 'Type must be module, api, page, ui, or feature',
      },
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      default: null,
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
  },
  {
    timestamps: true,
    collection: 'resources',
  },
);

resourceSchema.index({ type: 1, status: 1 });
resourceSchema.index({ parentId: 1 });
resourceSchema.index({ status: 1 });

resourceSchema.set('toJSON', { virtuals: true });
resourceSchema.set('toObject', { virtuals: true });

export const ResourceModel = model<IResource>('Resource', resourceSchema);
