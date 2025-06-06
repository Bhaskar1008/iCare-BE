import type { Document } from 'mongoose';
import { Schema, model } from 'mongoose';
import { LocationType } from '@/common/enums/location-type.enum';

export interface ILocation extends Document {
  type: LocationType;

  // Physical location properties
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  // Virtual location properties
  meetingUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  platform?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    type: {
      type: String,
      enum: Object.values(LocationType),
      required: true,
    },

    // Physical location fields
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    // Virtual location fields
    meetingUrl: {
      type: String,
      trim: true,
    },
    meetingId: {
      type: String,
      trim: true,
    },
    meetingPassword: {
      type: String,
    },
    platform: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Indexes
LocationSchema.index({ type: 1 });
LocationSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

export const Location = model<ILocation>('Location', LocationSchema);
