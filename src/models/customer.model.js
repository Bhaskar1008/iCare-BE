import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    enum: ['MALE', 'FEMALE', 'OTHER'],
    required: true,
  },
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    pinCode: String,
    country: String,
  },
  importance: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM',
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  policies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Policy',
  }],
  quotations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation',
  }],
  notes: String,
  leadSource: {
    type: String,
    enum: ['REFERRAL', 'WEBSITE', 'SOCIAL_MEDIA', 'DIRECT', 'OTHER'],
  },
}, {
  timestamps: true,
});

customerSchema.index({ assignedAgent: 1, importance: 1 });
customerSchema.index({ email: 1 }, { unique: true });
customerSchema.index({ phone: 1 });

export const Customer = mongoose.model('Customer', customerSchema);