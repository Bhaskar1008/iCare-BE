import { Schema, model, Types } from 'mongoose';
import type { IBaseModel } from './base.model';

export interface IProduct extends IBaseModel {
  name: string;
  description?: string;
  channels: Types.ObjectId[];
  isActive: boolean;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      unique: true
    },
    description: {
      type: String,
      trim: true
    },
    channels: [{
      type: Schema.Types.ObjectId,
      ref: 'Channel',
      required: true
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'products'
  }
);

// Indexes
productSchema.index({ name: 1 }, { unique: true });
productSchema.index({ isActive: 1 });
productSchema.index({ isDeleted: 1 });
productSchema.index({ createdAt: -1 });

export const ProductModel = model<IProduct>('Product', productSchema); 