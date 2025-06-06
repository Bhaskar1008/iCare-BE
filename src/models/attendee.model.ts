import type { Document, Types } from 'mongoose';
import { Schema, model } from 'mongoose';
import { AttendeeStatus } from '@/common/enums/attendee-status.enum';
import { AttendeeRole } from '@/common/enums/attendee-role.enum';

export interface IAttendee extends Document {
  event: Types.ObjectId;
  user: Types.ObjectId;
  status: AttendeeStatus;
  role: AttendeeRole;
  responseDateTime?: Date;
  notificationPreference: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AttendeeSchema = new Schema<IAttendee>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(AttendeeStatus),
      default: AttendeeStatus.PENDING,
    },
    role: {
      type: String,
      enum: Object.values(AttendeeRole),
      default: AttendeeRole.ATTENDEE,
    },
    responseDateTime: {
      type: Date,
    },
    notificationPreference: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Indexes
AttendeeSchema.index({ event: 1, user: 1 }, { unique: true });
AttendeeSchema.index({ status: 1 });

export const Attendee = model<IAttendee>('Attendee', AttendeeSchema);
