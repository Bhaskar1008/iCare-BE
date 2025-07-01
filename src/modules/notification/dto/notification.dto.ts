import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsMongoId,
  ValidateNested,
  IsObject,
  ArrayMinSize,
  MaxLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import type {
  NotificationType,
  NotificationStatus,
  RecipientType,
} from '@/models/notification.model';

// Constants for magic numbers
const TITLE_MAX_LENGTH = 200;
const MESSAGE_MAX_LENGTH = 1000;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;

export class NotificationRecipientDto {
  @IsMongoId()
  @IsNotEmpty()
  recipientId!: string;

  @IsEnum(['user', 'agent', 'admin'])
  @IsNotEmpty()
  recipientType!: RecipientType;
}

export class CreateNotificationDto {
  @IsEnum(['lead_created', 'lead_allocated', 'lead_status_updated'])
  @IsNotEmpty()
  type!: NotificationType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(TITLE_MAX_LENGTH)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(MESSAGE_MAX_LENGTH)
  message!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => NotificationRecipientDto)
  recipients!: NotificationRecipientDto[];

  @IsMongoId()
  @IsNotEmpty()
  triggeredBy!: string;

  @IsEnum(['user', 'agent', 'admin'])
  @IsNotEmpty()
  triggeredByType!: RecipientType;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateNotificationStatusDto {
  @IsEnum(['unread', 'read', 'archived'])
  @IsNotEmpty()
  status!: NotificationStatus;

  @IsMongoId()
  @IsNotEmpty()
  recipientId!: string;
}

export class NotificationQueryDto {
  @IsOptional()
  @IsMongoId()
  recipientId?: string;

  @IsOptional()
  @IsEnum(['user', 'agent', 'admin'])
  recipientType?: RecipientType;

  @IsOptional()
  @IsEnum(['lead_created', 'lead_allocated', 'lead_status_updated'])
  type?: NotificationType;

  @IsOptional()
  @IsEnum(['unread', 'read', 'archived'])
  status?: NotificationStatus;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(MAX_LIMIT)
  limit?: number = DEFAULT_LIMIT;

  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'priority'])
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class MarkAsReadDto {
  @IsMongoId()
  @IsNotEmpty()
  recipientId!: string;
}

export class MarkAllAsReadDto {
  @IsMongoId()
  @IsNotEmpty()
  recipientId!: string;

  @IsEnum(['user', 'agent', 'admin'])
  @IsNotEmpty()
  recipientType!: RecipientType;
}

export class NotificationStatsDto {
  @IsMongoId()
  @IsNotEmpty()
  recipientId!: string;

  @IsEnum(['user', 'agent', 'admin'])
  @IsNotEmpty()
  recipientType!: RecipientType;
}
