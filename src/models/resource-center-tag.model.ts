import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export interface IResourceCenterTag extends Document {
  tagName: string;
  updatedBy?: string;
  updatedAt: Date;
  createdBy?: string;
  createdAt: Date;
}

const resourceCenterTagSchema = new Schema<IResourceCenterTag>(
  {
    tagName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    updatedBy: {
      type: String,
      required: false,
    },
    createdBy: {
      type: String,
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Create index for tagName to ensure uniqueness
resourceCenterTagSchema.index({ tagName: 1 }, { unique: true });

export const ResourceCenterTagModel = mongoose.model<IResourceCenterTag>(
  'tags',
  resourceCenterTagSchema,
);
