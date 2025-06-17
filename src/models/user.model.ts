import type { Types } from 'mongoose';
import { Schema, model } from 'mongoose';
import { VALIDATION } from '@/common/constants/http-status.constants';
import type { IBaseModel } from './base.model';
import type { IProject } from './project.model';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const PASSWORD_MIN_LENGTH = 8;
const SALT_ROUNDS = 10;
const RESET_TOKEN_BYTES = 32;
const PASSWORD_RESET_EXPIRY = 10 * 60 * 1000;

export interface IUser extends IBaseModel {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role: 'user' | 'admin' | 'superadmin';
  projectId?: Types.ObjectId | IProject;
  allProjects?: IProject[];
  agentCode?: string;
  otp?: string;
  refreshToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLoginAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createPasswordResetToken(): string;
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
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [
        PASSWORD_MIN_LENGTH,
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
      ],
      select: false,
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
    role: {
      type: String,
      enum: ['user', 'admin', 'superadmin'],
      default: 'user',
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [
        function (this: IUser) {
          return this.role === 'user';
        },
        'Project ID is required for user role',
      ],
    },
    refreshToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
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

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error(String(error)));
  }
});

// Validate projectId based on role
userSchema.pre('save', function (next) {
  if (this.role === 'user' && !this.projectId) {
    next(new Error('Project ID is required for user role'));
  } else if (this.role !== 'user') {
    this.projectId = undefined; // Clear projectId for non-user roles
  }
  next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password as string);
};

userSchema.methods.createPasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');
  const hash = crypto.createHash('sha256');
  hash.update(resetToken, 'utf8');

  this.passwordResetToken = hash.digest('hex');

  const TEN_MINUTES_IN_MS = PASSWORD_RESET_EXPIRY;
  this.passwordResetExpires = new Date(Date.now() + TEN_MINUTES_IN_MS);

  return resetToken;
};

userSchema.index({ isActive: 1 });
userSchema.index({ projectId: 1 });
userSchema.index({ createdAt: -1 });

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.refreshToken;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    return ret;
  },
});
userSchema.set('toObject', { virtuals: true });

export const UserModel = model<IUser>('User', userSchema);
