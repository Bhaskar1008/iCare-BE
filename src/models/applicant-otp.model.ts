import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export interface IApplicantOtp extends Document {
  emailAddress: string;
  otp: string;
  createdAt: Date;
  isUsed: boolean;
}

const ApplicantOtpSchema = new Schema({
  emailAddress: {
    type: String,
    required: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
    length: 4,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 900, // 15 minutes in seconds
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
});

// Add index for faster queries
ApplicantOtpSchema.index({ emailAddress: 1, createdAt: -1 });

export const ApplicantOtpModel = mongoose.model<IApplicantOtp>(
  'ApplicantOtp',
  ApplicantOtpSchema,
);
