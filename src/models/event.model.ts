import type { Document, Types } from 'mongoose';
import { Schema, model } from 'mongoose';
import { EventStatus } from '@/common/enums/event-status.enum';

export interface IEvent extends Document {
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  createdBy: Types.ObjectId;
  location: Types.ObjectId;
  attendees: Types.ObjectId[];
  status: EventStatus;
  eventWith: string;
  eventSubtype: string;
  type?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    startDateTime: {
      type: Date,
      required: true,
    },
    endDateTime: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    location: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    attendees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Agent',
      },
    ],
    status: {
      type: String,
      enum: Object.values(EventStatus),
      default: EventStatus.SCHEDULED,
    },
    eventWith: {
      type: String,
      trim: true,
    },
    eventSubtype: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Indexes for better query performance
EventSchema.index({ startDateTime: 1, endDateTime: 1 });
EventSchema.index({ createdBy: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ eventWith: 1 });
EventSchema.index({ eventSubtype: 1 });
EventSchema.index({ type: 1 });
EventSchema.index({ attendees: 1 });

export const Event = model<IEvent>('Event', EventSchema);
