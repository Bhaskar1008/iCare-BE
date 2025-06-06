import type { Types } from 'mongoose';
import type { EventStatus } from '@/common/enums/event-status.enum';
import type { ILocation } from '@/models/location.model';

export interface UpdateEventDto {
  title?: string;
  description?: string;
  startDateTime?: Date;
  endDateTime?: Date;
  location?: Omit<ILocation, keyof Document>;
  attendees?: Types.ObjectId[];
  status?: EventStatus;

  metadata?: Record<string, any>;
}
