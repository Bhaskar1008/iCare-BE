import { Schema, model } from 'mongoose';
import { VALIDATION } from '@/common/constants/http-status.constants';
import type { IBaseModel } from './base.model';

export interface IUser extends IBaseModel {
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLoginAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [
        VALIDATION.MAX_NAME_LENGTH,
        `First name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
      ],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [
        VALIDATION.MAX_NAME_LENGTH,
        `Last name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
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
    collection: 'users',
  },
);

userSchema.index({ email: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ createdAt: -1 });

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

export const UserModel = model<IUser>('User', userSchema);
