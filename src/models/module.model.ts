import { Schema, model } from 'mongoose';
import { VALIDATION } from '@/common/constants/http-status.constants';
import type { IBaseModel } from './base.model';

/** Interface for flexible config fields */
export interface IConfigField {
  fieldName: string;
  fieldType: string;
  description?: string;
  values: any[]; // Fully flexible
}

export interface IModule extends IBaseModel {
  name: string;
  code: string;
  description?: string;
  accessControl: boolean;
  defaultConfig: IConfigField[];
  isActive: boolean;
  isCore: boolean;
  version: string;
  dependencies?: string[];
  permissions?: string[];
}
const configFieldSchema = new Schema<IConfigField>(
  {
    fieldName: { type: String, required: true },
    fieldType: { type: String, required: true },
    description: { type: String },
    values: {
      type: [Schema.Types.Mixed] as any, // Free-form array of any structure
      required: true,
    },
  },
  { _id: false }, // Prevents auto-generating _id for each field
);

const moduleSchema = new Schema<IModule>(
  {
    name: {
      type: String,
      required: [true, 'Module name is required'],
      trim: true,
      maxlength: [
        VALIDATION.MAX_NAME_LENGTH,
        `Module name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
      ],
    },
    code: {
      type: String,
      required: [true, 'Module code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [
        VALIDATION.MAX_CODE_LENGTH,
        `Module code cannot exceed ${VALIDATION.MAX_CODE_LENGTH} characters`,
      ],
      match: [
        /^[A-Z0-9_]+$/,
        'Module code can only contain uppercase letters, numbers, and underscores',
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [
        VALIDATION.MAX_DESCRIPTION_LENGTH,
        `Description cannot exceed ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters`,
      ],
    },
    accessControl: {
      type: Boolean,
      default: false,
    },
    defaultConfig: {
      type: [configFieldSchema] as any,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isCore: {
      type: Boolean,
      default: false,
    },
    version: {
      type: String,
      required: [true, 'Module version is required'],
      default: '1.0.0',
    },
    dependencies: [
      {
        type: String,
        trim: true,
      },
    ],
    permissions: [
      {
        type: String,
        trim: true,
      },
    ],
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
    collection: 'modules',
  },
);

// Indexes
moduleSchema.index({ name: 1 });
moduleSchema.index({ code: 1 }, { unique: true });
moduleSchema.index({ isActive: 1 });
moduleSchema.index({ isCore: 1 });
moduleSchema.index({ isDeleted: 1 });
moduleSchema.index({ createdAt: -1 });

moduleSchema.set('toJSON', { virtuals: true });
moduleSchema.set('toObject', { virtuals: true });

export const ModuleModel = model<IModule>('Module', moduleSchema);
