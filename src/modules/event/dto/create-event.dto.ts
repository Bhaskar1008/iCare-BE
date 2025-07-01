import type { Types } from 'mongoose';
import type { ILocation } from '@/models/location.model';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDate,
  IsArray,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LocationDto } from '@/common/dto/location.dto';

export interface CreateEventDto {
  title: string;
  description: string;
  startDateTime: Date;
  endDateTime: Date;
  createdBy: Types.ObjectId;
  location: Omit<ILocation, keyof Document>;
  attendees: Types.ObjectId[];
  eventWith: string;
  eventSubtype: string;
  type?: string;
  metadata?: Record<string, any>;
}

export class CreateEventValidationDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title!: string;

  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  description!: string;

  @IsDate()
  @IsNotEmpty({ message: 'Start date is required' })
  startDateTime!: Date;

  @IsDate()
  @IsNotEmpty({ message: 'End date is required' })
  endDateTime!: Date;

  @IsString()
  @IsNotEmpty({ message: 'Created by is required' })
  createdBy!: Types.ObjectId;

  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty({ message: 'Location is required' })
  location!: LocationDto;

  @IsArray()
  @IsOptional()
  attendees?: Types.ObjectId[];

  @IsString()
  @IsNotEmpty({ message: 'Event With is required' })
  eventWith!: string;

  @IsString()
  @IsNotEmpty({ message: 'Event Subtype is required' })
  eventSubtype!: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
