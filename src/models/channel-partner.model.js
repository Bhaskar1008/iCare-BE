import mongoose from 'mongoose';

const channelPartnerSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['INDIVIDUAL', 'CORPORATE'],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED'],
    default: 'PENDING',
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
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    pinCode: String,
    country: String,
  },
  documents: [{
    type: String,
    name: String,
    url: String,
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    uploadedAt: Date,
  }],
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    branchName: String,
    ifscCode: String,
  },
  commissionStructure: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  performance: {
    totalPolicies: {
      type: Number,
      default: 0,
    },
    totalPremium: {
      type: Number,
      default: 0,
    },
    activeCustomers: {
      type: Number,
      default: 0,
    },
  },
  // Additional fields for corporate partners
  corporateDetails: {
    registrationNumber: String,
    taxId: String,
    incorporationDate: Date,
    representativeName: String,
    representativeDesignation: String,
  },
  // Additional fields for individual partners
  individualDetails: {
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
    },
    qualification: String,
    experience: Number,
  },
}, {
  timestamps: true,
});

channelPartnerSchema.index({ code: 1 }, { unique: true });
channelPartnerSchema.index({ email: 1 }, { unique: true });
channelPartnerSchema.index({ status: 1 });
channelPartnerSchema.index({ type: 1 });

export const ChannelPartner = mongoose.model('ChannelPartner', channelPartnerSchema);