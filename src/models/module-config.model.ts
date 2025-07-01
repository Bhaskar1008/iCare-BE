import { Schema, model, type Types } from 'mongoose';
import type { IBaseModel } from './base.model';
import type { IModule } from './module.model';
import type { IProject } from './project.model';

/** Interface for flexible config fields */
export interface IConfigField {
  fieldName: string;
  fieldType: string;
  description?: string;
  values: any[]; // Fully flexible
}

/** Main interface */
export interface IModuleConfig extends IBaseModel {
  moduleId: Types.ObjectId | IModule;
  projectId?: Types.ObjectId | IProject;
  configName: string;
  description?: string;
  fields: IConfigField[];
  metadata?: Record<string, unknown>;
  isDeleted?: boolean;
  deletedAt?: Date | null;
}

// Field schema for each field in the module config
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

// Full module config schema
const moduleConfigSchema = new Schema<IModuleConfig>(
  {
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    configName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    fields: {
      type: [configFieldSchema],
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
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
    timestamps: true, // adds createdAt and updatedAt
    collection: 'moduleConfigs',
  },
);

// Indexes
moduleConfigSchema.index(
  { moduleId: 1, projectId: 1, configName: 1 },
  { unique: true },
);
moduleConfigSchema.index({ moduleId: 1 });
moduleConfigSchema.index({ projectId: 1 });
moduleConfigSchema.index({ configName: 1 });
moduleConfigSchema.index({ isDeleted: 1 });
moduleConfigSchema.index({ createdAt: -1 });

// Enable virtuals
moduleConfigSchema.set('toJSON', { virtuals: true });
moduleConfigSchema.set('toObject', { virtuals: true });

// Export model
export const ModuleConfigModel = model<IModuleConfig>(
  'ModuleConfig',
  moduleConfigSchema,
);
