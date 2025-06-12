import { Schema, model } from 'mongoose';
import type { IBaseModel } from './base.model';

// Constants to replace magic numbers
const MAX_NAME_LENGTH = 100;

export interface ICity {
  _id: string;
  name: string;
  isCapital: boolean;
}

export interface IProvince extends IBaseModel {
  name: string;
  cities: ICity[];
}

const citySchema = new Schema<ICity>({
  name: {
    type: String,
    required: [true, 'City name is required'],
    trim: true,
    maxlength: [MAX_NAME_LENGTH, 'City name cannot exceed 100 characters'],
  },
  isCapital: {
    type: Boolean,
    default: false,
  },
});

const provinceSchema = new Schema<IProvince>(
  {
    name: {
      type: String,
      required: [true, 'Province name is required'],
      trim: true,
      unique: true,
      maxlength: [
        MAX_NAME_LENGTH,
        'Province name cannot exceed 100 characters',
      ],
    },
    cities: [citySchema],
  },
  {
    timestamps: true,
    collection: 'provinces',
  },
);

// Create indexes
provinceSchema.index({ name: 1 });

export const ProvinceModel = model<IProvince>('Province', provinceSchema);
