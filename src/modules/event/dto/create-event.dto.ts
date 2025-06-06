import type { Types } from 'mongoose';
import type { ILocation } from '@/models/location.model';

export interface CreateEventDto {
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  createdBy: Types.ObjectId;
  location: Omit<ILocation, keyof Document>;
  attendees?: Types.ObjectId[];

  metadata?: Record<string, any>;
}
