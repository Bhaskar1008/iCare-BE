import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  agentCode: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['EMAIL', 'SMS'],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export const OTP = mongoose.model('OTP', otpSchema);