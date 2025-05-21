import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['INDIVIDUAL', 'CORPORATE'],
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  workExperience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
  }],
  education: [{
    degree: String,
    institution: String,
    yearCompleted: Number,
  }],
  tier: {
    type: String,
    enum: ['TIER 1', 'TIER 2', 'TIER 3'],
    default: 'TIER 1',
  },
  performance: {
    totalPremiums: Number,
    premiumsDue: Number,
    renewals: Number,
    expiringQuotes: Number,
  },
}, {
  timestamps: true,
});

export const Agent = mongoose.model('Agent', agentSchema);