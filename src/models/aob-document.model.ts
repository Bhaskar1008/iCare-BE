import { Schema, model, type Document, type Types } from 'mongoose';

export interface IAobDocument extends Document {
  _id: Types.ObjectId;
  presignedS3Url: string;
  documentId: string;
  applicationId: string;
  documentStatus: 'approve' | 'reject' | 'documentSubmitted';
  remarks?: string;
  documentType: 'pdf' | 'png' | 'jpg';
  documentFormat: 'pdf' | 'png' | 'jpg';
  documentName: string;
  s3Key: string;
  createdAt: Date;
  updatedAt: Date;
}

const AobDocumentSchema = new Schema<IAobDocument>(
  {
    presignedS3Url: {
      type: String,
      required: true,
      trim: true,
    },
    documentId: {
      type: String,
      required: true,
      trim: true,
    },
    applicationId: {
      type: String,
      required: true,
    },
    documentStatus: {
      type: String,
      enum: ['approve', 'reject', 'documentSubmitted'],
      default: 'documentSubmitted',
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    documentType: {
      type: String,
      required: true,
    },
    documentFormat: {
      type: String,
      enum: ['pdf', 'png', 'jpg'],
      required: true,
    },
    documentName: {
      type: String,
      required: true,
      trim: true,
    },
    s3Key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Drop existing indexes
AobDocumentSchema.index({ applicationId: 1 });
AobDocumentSchema.index({ documentStatus: 1 });
AobDocumentSchema.index({ documentType: 1 });
AobDocumentSchema.index({ createdAt: -1 });

// Create a compound index for documentType and applicationId
AobDocumentSchema.index(
  { documentType: 1, applicationId: 1 },
  { unique: true },
);

export const AobDocumentModel = model<IAobDocument>(
  'AobDocument',
  AobDocumentSchema,
);
