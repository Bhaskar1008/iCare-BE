import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
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
    enum: ['OPEN', 'FOR_TODAY', 'DISCARDED', 'CONVERTED', 'FAILED'],
    default: 'OPEN',
  },
  type: {
    type: String,
    enum: ['SALES', 'INDIVIDUAL'],
    required: true,
  },
  mobileNo: {
    type: String,
    required: true,
  },
  allocatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  allocatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  appointmentDate: Date,
  notes: String,
  followUpHistory: [{
    date: Date,
    status: String,
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  }],
}, {
  timestamps: true,
});

// Create indexes for frequently queried fields
leadSchema.index({ status: 1, allocatedTo: 1 });
leadSchema.index({ code: 1 });

export const Lead = mongoose.model('Lead', leadSchema);