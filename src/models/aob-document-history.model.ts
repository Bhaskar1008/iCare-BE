import { Schema, model, type Document, type Types } from 'mongoose';

export interface IAobDocumentHistory extends Document {
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

const AobDocumentHistorySchema = new Schema<IAobDocumentHistory>(
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

// Create indexes for efficient querying
AobDocumentHistorySchema.index({ documentId: 1 });
AobDocumentHistorySchema.index({ applicationId: 1 });
AobDocumentHistorySchema.index({ documentStatus: 1 });
AobDocumentHistorySchema.index({ createdAt: -1 });

export const AobDocumentHistoryModel = model<IAobDocumentHistory>(
  'AobDocumentHistory',
  AobDocumentHistorySchema,
);
