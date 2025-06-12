import type { Types } from 'mongoose';
import { Schema, model } from 'mongoose';
import type { IBaseModel } from './base.model';

export interface IPermission extends IBaseModel {
  resourceId: Types.ObjectId;
  action:
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | 'view'
    | 'edit'
    | 'publish'
    | 'approve'
    | 'reject'
    | 'export'
    | 'import'
    | 'share'
    | 'download'
    | 'upload'
    | 'admin'
    | 'manage'
    | '*';
  effect: 'allow' | 'deny';
  conditions?: Record<string, unknown>; // Simple flexible conditions
  status: 'active' | 'inactive';
}

const permissionSchema = new Schema<IPermission>(
  {
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      required: [true, 'Resource ID is required'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: {
        values: [
          'create',
          'read',
          'update',
          'delete',
          'view',
          'edit',
          'publish',
          'approve',
          'reject',
          'export',
          'import',
          'share',
          'download',
          'upload',
          'admin',
          'manage',
          '*',
        ],
        message: 'Action must be one of the defined values',
      },
    },
    effect: {
      type: String,
      required: [true, 'Effect is required'],
      enum: {
        values: ['allow', 'deny'],
        message: 'Effect must be allow or deny',
      },
      default: 'allow',
    },
    conditions: {
      type: Schema.Types.Mixed,
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
    collection: 'permissions',
  },
);

// Simple indexes
permissionSchema.index(
  { resourceId: 1, action: 1, effect: 1 },
  { unique: true },
);
permissionSchema.index({ resourceId: 1, status: 1 });
permissionSchema.index({ status: 1 });

permissionSchema.set('toJSON', { virtuals: true });
permissionSchema.set('toObject', { virtuals: true });

export const PermissionModel = model<IPermission>(
  'Permission',
  permissionSchema,
);
