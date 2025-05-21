import mongoose from 'mongoose';

const calendarSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['APPOINTMENT', 'TASK', 'REMINDER', 'MEETING'],
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  allDay: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM',
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'OVERDUE'],
    default: 'SCHEDULED',
  },
  description: String,
  location: String,
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
      default: 'PENDING',
    },
  }],
  relatedTo: {
    type: String,
    enum: ['CUSTOMER', 'LEAD', 'POLICY', 'QUOTATION'],
    required: true,
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'relatedTo',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reminders: [{
    time: Date,
    type: {
      type: String,
      enum: ['EMAIL', 'SMS', 'PUSH'],
    },
    sent: {
      type: Boolean,
      default: false,
    },
  }],
}, {
  timestamps: true,
});

calendarSchema.index({ startDate: 1 });
calendarSchema.index({ createdBy: 1 });
calendarSchema.index({ status: 1 });
calendarSchema.index({ 'attendees.user': 1 });

export const Calendar = mongoose.model('Calendar', calendarSchema);