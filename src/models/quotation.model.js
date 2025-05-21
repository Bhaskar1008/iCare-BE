import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema({
  quotationNumber: {
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
    enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CONVERTED'],
    default: 'DRAFT',
  },
  validUntil: {
    type: Date,
    required: true,
  },
  notes: String,
  riskAssessment: {
    score: Number,
    factors: [String],
    recommendations: [String],
  },
}, {
  timestamps: true,
});

quotationSchema.index({ quotationNumber: 1 }, { unique: true });
quotationSchema.index({ customer: 1 });
quotationSchema.index({ agent: 1 });
quotationSchema.index({ status: 1 });
quotationSchema.index({ validUntil: 1 });

export const Quotation = mongoose.model('Quotation', quotationSchema);