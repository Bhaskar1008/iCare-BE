import mongoose from 'mongoose';

const policySchema = new mongoose.Schema({
  policyNumber: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ['MOTOR', 'TRAVEL', 'HEALTH', 'LIFE', 'PROPERTY'],
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  premium: {
    amount: {
      type: Number,
      required: true,
    },
    frequency: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL'],
      required: true,
    },
    nextDueDate: Date,
  },
  coverage: {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    details: mongoose.Schema.Types.Mixed,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED'],
    default: 'PENDING',
  },
  documents: [{
    type: String,
    name: String,
    url: String,
    uploadedAt: Date,
  }],
  claims: [{
    claimNumber: String,
    dateSubmitted: Date,
    status: String,
    amount: Number,
    description: String,
  }],
  riskInspectionStatus: {
    type: String,
    enum: ['NOT_REQUIRED', 'REQUIRED', 'COMPLETED', 'PENDING'],
    default: 'NOT_REQUIRED',
  },
}, {
  timestamps: true,
});

policySchema.index({ policyNumber: 1 }, { unique: true });
policySchema.index({ customer: 1 });
policySchema.index({ agent: 1 });
policySchema.index({ 'premium.nextDueDate': 1 });
policySchema.index({ status: 1 });

export const Policy = mongoose.model('Policy', policySchema);