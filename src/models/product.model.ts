import type { Types } from 'mongoose';
import { Schema, model } from 'mongoose';
import { VALIDATION } from '@/common/constants/http-status.constants';
import type { IBaseModel } from './base.model';

// Media interfaces
export interface IProductVideo {
  _id?: Types.ObjectId;
  title: string;
  s3Links: string[];
  youtubeUrl?: string;
  isActive: boolean;
  uploadedAt: Date;
}

export interface IProductImage {
  _id?: Types.ObjectId;
  title: string;
  s3Link: string;
  isActive: boolean;
  uploadedAt: Date;
}

// File interface
export interface IProductFile {
  _id?: Types.ObjectId;
  categoryId: Types.ObjectId;
  fileType: 'PDF' | 'PPT';
  language: string;
  brochureName: string;
  s3Link: string;
  uploadedAt: Date;
}

// Main Product interface
export interface IProduct extends IBaseModel {
  productCategoryId: Types.ObjectId;
  channelIds: Types.ObjectId[];
  productName: string;
  status: 'active' | 'inactive';
  webLink?: string;
  applicationId?: string;
  productDescription?: string;
  reasonsToBuy: {
    reason1: string;
    reason2: string;
    reason3?: string;
    reason4?: string;
    reason5?: string;
  };
  media: {
    videos: IProductVideo[];
    images: IProductImage[];
  };
  files: IProductFile[];
  createdBy: Types.ObjectId;
}

// Sub-schemas
const productVideoSchema = new Schema<IProductVideo>(
  {
    title: {
      type: String,
      required: [true, 'Video title is required'],
      trim: true,
      maxlength: [100, 'Video title cannot exceed 100 characters'],
    },
    s3Links: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    youtubeUrl: {
      type: String,
      trim: true,
      match: [
        /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/,
        'Please enter a valid YouTube URL',
      ],
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const productImageSchema = new Schema<IProductImage>(
  {
    title: {
      type: String,
      required: [true, 'Image title is required'],
      trim: true,
      maxlength: [100, 'Image title cannot exceed 100 characters'],
    },
    s3Link: {
      type: String,
      required: [true, 'Image S3 link is required'],
      trim: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const productFileSchema = new Schema<IProductFile>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'ProductCategory',
      required: [true, 'File category is required'],
    },
    fileType: {
      type: String,
      required: [true, 'File type is required'],
      enum: {
        values: ['PDF', 'PPT'],
        message: 'File type must be either PDF or PPT',
      },
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true,
      maxlength: [50, 'Language cannot exceed 50 characters'],
    },
    brochureName: {
      type: String,
      required: [true, 'Brochure name is required'],
      trim: true,
      maxlength: [100, 'Brochure name cannot exceed 100 characters'],
    },
    s3Link: {
      type: String,
      required: [true, 'File S3 link is required'],
      trim: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const reasonsToBuySchema = new Schema(
  {
    reason1: {
      type: String,
      required: [true, 'First reason to buy is required'],
      trim: true,
      maxlength: [300, 'Reason cannot exceed 300 characters'],
    },
    reason2: {
      type: String,
      required: [true, 'Second reason to buy is required'],
      trim: true,
      maxlength: [300, 'Reason cannot exceed 300 characters'],
    },
    reason3: {
      type: String,
      trim: true,
      maxlength: [300, 'Reason cannot exceed 300 characters'],
    },
    reason4: {
      type: String,
      trim: true,
      maxlength: [300, 'Reason cannot exceed 300 characters'],
    },
    reason5: {
      type: String,
      trim: true,
      maxlength: [300, 'Reason cannot exceed 300 characters'],
    },
  },
  { _id: false },
);

const mediaSchema = new Schema(
  {
    videos: {
      type: [productVideoSchema],
      default: [],
    },
    images: {
      type: [productImageSchema],
      default: [],
    },
  },
  { _id: false },
);

// Main Product schema
const productSchema = new Schema<IProduct>(
  {
    productCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'ProductCategory',
      required: [true, 'Product category is required'],
      index: true,
    },
    channelIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Channel',
        required: true,
      },
    ],
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      unique: true,
      maxlength: [
        VALIDATION.MAX_NAME_LENGTH,
        `Product name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
      ],
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
    webLink: {
      type: String,
      trim: true,
      match: [
        /^(https?:\/\/)[^\s/$.?#].[^\s]*$/,
        'Please enter a valid web link',
      ],
    },
    applicationId: {
      type: String,
      trim: true,
      maxlength: [50, 'Application ID cannot exceed 50 characters'],
    },
    productDescription: {
      type: String,
      trim: true,
      maxlength: [
        VALIDATION.MAX_DESCRIPTION_LENGTH,
        `Product description cannot exceed ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters`,
      ],
    },
    reasonsToBuy: {
      type: reasonsToBuySchema,
      required: [true, 'At least two reasons to buy are required'],
    },
    media: {
      type: mediaSchema,
      default: { videos: [], images: [] },
    },
    files: {
      type: [productFileSchema],
      default: [],
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
    collection: 'products',
  },
);

// Indexes
productSchema.index({ productName: 1 }, { unique: true });
productSchema.index({ productCategoryId: 1 });
productSchema.index({ channelIds: 1 });
productSchema.index({ status: 1 });
productSchema.index({ createdBy: 1 });
productSchema.index({ isDeleted: 1 });
productSchema.index({ createdAt: -1 });

// Compound indexes
productSchema.index({ status: 1, isDeleted: 1 });
productSchema.index({ productCategoryId: 1, status: 1, isDeleted: 1 });
productSchema.index({ channelIds: 1, status: 1, isDeleted: 1 });

// Validation for channelIds array
productSchema.pre('save', function (next) {
  if (!this.channelIds || this.channelIds.length === 0) {
    next(new Error('At least one channel must be selected'));
  } else {
    next();
  }
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export const ProductModel = model<IProduct>('Product', productSchema);
