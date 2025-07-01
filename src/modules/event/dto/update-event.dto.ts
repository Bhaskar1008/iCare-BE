import type { Types } from 'mongoose';
import type { EventStatus } from '@/common/enums/event-status.enum';
import {
  IsString,
  IsOptional,
  IsDate,
  IsObject,
  IsArray,
  ValidateNested,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LocationDto {
  @IsMongoId()
  @IsOptional()
  _id?: string;

  @IsString()
  type!: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  startDateTime?: Date;
  endDateTime?: Date;
  location?: string | LocationDto;
  attendees?: string[];
  status?: EventStatus;
  eventWith?: string;
  type?: string;
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

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsString()
  @IsOptional()
  status!: EventStatus;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  attendees!: string[];

  @IsString()
  @IsOptional()
  eventWith?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsObject()
  @IsOptional()
  metadata!: Record<string, unknown>;
}
