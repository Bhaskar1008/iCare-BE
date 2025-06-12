import type { Types } from 'mongoose';
import { Schema, model } from 'mongoose';
import { VALIDATION } from '@/common/constants/http-status.constants';
import type { IBaseModel } from './base.model';

export interface IProductCategory extends IBaseModel {
  categoryName: string;
  sequenceNumber: number;
  status: 'active' | 'inactive';
  createdBy: Types.ObjectId;
}

const productCategorySchema = new Schema<IProductCategory>(
  {
    categoryName: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      maxlength: [
        VALIDATION.MAX_NAME_LENGTH,
        `Category name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
      ],
    },
    sequenceNumber: {
      type: Number,
      required: [true, 'Sequence number is required'],
      min: [0, 'Sequence number cannot be negative'],
      default: 0,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['active', 'inactive'],
        message: 'Status must be either active or inactive',
      },
      default: 'active',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
      index: true,
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
    collection: 'productCategories',
  },
);

// Indexes
productCategorySchema.index({ categoryName: 1 }, { unique: true });
productCategorySchema.index({ sequenceNumber: 1 });
productCategorySchema.index({ status: 1 });
productCategorySchema.index({ createdBy: 1 });
productCategorySchema.index({ isDeleted: 1 });
productCategorySchema.index({ createdAt: -1 });

// Compound indexes
productCategorySchema.index({ status: 1, isDeleted: 1, sequenceNumber: 1 });
productCategorySchema.index({ createdBy: 1, status: 1, isDeleted: 1 });

productCategorySchema.set('toJSON', { virtuals: true });
productCategorySchema.set('toObject', { virtuals: true });

export const ProductCategoryModel = model<IProductCategory>(
  'ProductCategory',
  productCategorySchema,
);
