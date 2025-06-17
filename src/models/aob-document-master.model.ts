import { Schema, model, type Document, type Types } from 'mongoose';

export interface IAobDocumentMaster extends Document {
  _id: Types.ObjectId;
  documentName: string;
  documentType: string;
  documentDescription: string;
  documentInstruction: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AobDocumentMasterSchema = new Schema<IAobDocumentMaster>(
  {
    documentName: {
      type: String,
      required: true,
      trim: true,
    },
    documentType: {
      type: String,
      required: true,
      trim: true,
    },
    documentDescription: {
      type: String,
      required: true,
      trim: true,
    },
    documentInstruction: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: false,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Index for better query performance
AobDocumentMasterSchema.index({ documentType: 1 });
AobDocumentMasterSchema.index({ category: 1 });
AobDocumentMasterSchema.index({ documentName: 1 });

export const AobDocumentMasterModel = model<IAobDocumentMaster>(
  'AobDocumentMaster',
  AobDocumentMasterSchema,
);
