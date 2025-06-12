import type { Types } from 'mongoose';
import type { EventStatus } from '@/common/enums/event-status.enum';
import type { ILocation } from '@/models/location.model';
import { IsString, IsOptional, IsDate, IsObject } from 'class-validator';

export interface UpdateEventDto {
  title?: string;
  description?: string;
  startDateTime?: Date;
  endDateTime?: Date;
  location?: Omit<ILocation, keyof Document>;
  attendees?: Types.ObjectId[];
  status?: EventStatus;

  metadata?: Record<string, unknown>;
}

export class UpdateEventValidationDto {
  @IsString()
  @IsOptional()
  title!: string;

  @IsString()
  @IsOptional()
  description!: string;

  @IsDate()
  @IsOptional()
  startDateTime!: Date;

  @IsDate()
  @IsOptional()
  endDateTime!: Date;

  @IsString()
  @IsOptional()
  createdBy!: Types.ObjectId;

  @IsString()
  @IsOptional()
  location!: Omit<ILocation, keyof Document>;

  @IsString()
  @IsOptional()
  status!: EventStatus;

  @IsString()
  @IsOptional()
  attendees!: Types.ObjectId[];

  @IsObject()
  @IsOptional()
  metadata!: Record<string, any>;
}
