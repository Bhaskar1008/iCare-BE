import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export interface IResourceCenterDocument extends Document {
  documentId: string;
  s3Key: string;
  s3Link: string;
  documentType: string[];
  documentFormat: string;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const resourceCenterDocumentSchema = new Schema<IResourceCenterDocument>(
  {
    documentId: {
      type: String,
      required: true,
    },
    s3Key: {
      type: String,
      required: true,
    },
    s3Link: {
      type: String,
      required: true,
    },
    documentType: {
      type: [String],
      enum: ['VIDEOS', 'PDF', 'ARTICLE', 'INFOGRAPHICS'],
      required: true,
    },
    documentFormat: {
      type: String,
      enum: ['pdf', 'png', 'jpg', 'mp4'],
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
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

export const ResourceCenterDocumentModel =
  mongoose.model<IResourceCenterDocument>(
    'resourceCenterDocument',
    resourceCenterDocumentSchema,
  );
