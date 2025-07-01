import { Schema, model, type Types } from 'mongoose';
import type { IBaseModel } from './base.model';
import type { IProject } from './project.model';
import type { IChannel } from './channel.model';
import type { IModule } from './module.model';
import type { IRole } from './role.model';

interface IRoleConfig {
  roleId: Types.ObjectId | IRole;
  status: boolean;
}

export interface IModuleConfig {
  moduleId: Types.ObjectId | IModule;
  roleConfigs: IRoleConfig[];
}

export interface IAccessControl extends IBaseModel {
  projectId: Types.ObjectId | IProject;
  channelId: Types.ObjectId | IChannel;
  moduleConfigs: IModuleConfig[];
  isDeleted?: boolean;
  deletedAt?: Date | null;
}

const roleConfigSchema = new Schema<IRoleConfig>(
  {
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: [true, 'Role ID is required'],
    },
    status: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const moduleConfigSchema = new Schema<IModuleConfig>(
  {
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'Module ID is required'],
    },
    roleConfigs: {
      type: [roleConfigSchema],
      required: [true, 'Role configurations are required'],
      validate: {
        validator(configs: IRoleConfig[]) {
          return configs && configs.length > 0;
        },
        message: 'At least one role configuration is required',
      },
    },
  },
  { _id: false },
);

const accessControlSchema = new Schema<IAccessControl>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
    },
    channelId: {
      type: Schema.Types.ObjectId,
      ref: 'Channel',
      required: [true, 'Channel ID is required'],
    },
    moduleConfigs: {
      type: [moduleConfigSchema],
      required: [true, 'Module configurations are required'],
      validate: {
        validator(configs: IModuleConfig[]) {
          return configs && configs.length > 0;
        },
        message: 'At least one module configuration is required',
      },
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
    collection: 'accessControls',
  },
);

// Indexes
accessControlSchema.index({ projectId: 1, channelId: 1 }, { unique: true });

accessControlSchema.set('toJSON', { virtuals: true });
accessControlSchema.set('toObject', { virtuals: true });

export const AccessControlModel = model<IAccessControl>(
  'AccessControl',
  accessControlSchema,
);
