import type { Types } from 'mongoose';
import { Schema, model } from 'mongoose';
import { VALIDATION } from '@/common/constants/http-status.constants';
import type { IBaseModel } from './base.model';
import type { IModule } from './module.model';

export interface IProject extends IBaseModel {
  projectName: string;
  projectCode: string;
  description?: string;
  modules: {
    moduleId: Types.ObjectId | IModule;
    isActive: boolean;
    config: Record<string, any>;
  }[];
  projectStatus: 'active' | 'inactive';
}

const projectSchema = new Schema<IProject>(
  {
    projectName: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [
        VALIDATION.MAX_NAME_LENGTH,
        `Project name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
      ],
    },
    projectCode: {
      type: String,
      required: [true, 'Project code is required'],
      uppercase: true,
      trim: true,
      maxlength: [
        VALIDATION.MAX_CODE_LENGTH,
        `Project code cannot exceed ${VALIDATION.MAX_CODE_LENGTH} characters`,
      ],
      match: [
        /^[A-Z0-9_]+$/,
        'Project code can only contain uppercase letters, numbers, and underscores',
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
    modules: [
      {
        moduleId: {
          type: Schema.Types.ObjectId,
          ref: 'Module',
          required: [true, 'Module ID is required'],
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        config: {
          type: Schema.Types.Mixed,
          default: {},
        },
      },
    ],
    projectStatus: {
      type: String,
      required: [true, 'Project status is required'],
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
    collection: 'projects',
  },
);

// Indexes
projectSchema.index({ projectName: 1 });
projectSchema.index({ projectCode: 1 }, { unique: true });
projectSchema.index({ 'modules.moduleId': 1 });
projectSchema.index({ projectStatus: 1 });
projectSchema.index({ isDeleted: 1 });
projectSchema.index({ createdAt: -1 });

// Validation for modules array
projectSchema.pre('save', function (next) {
  if (!this.modules || this.modules.length === 0) {
    next(new Error('At least one module must be selected'));
  } else {
    next();
  }
});

projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

export const ProjectModel = model<IProject>('Project', projectSchema);
