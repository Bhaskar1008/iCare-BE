import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  Matches,
  MaxLength,
  IsMongoId,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { VALIDATION } from '@/common/constants/http-status.constants';

export class CreateChannelDto {
  @IsString({ message: 'Channel name must be a string' })
  @IsNotEmpty({ message: 'Channel name cannot be empty' })
  @MaxLength(VALIDATION.MAX_NAME_LENGTH, {
    message: `Channel name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  channelName!: string;

  @IsString({ message: 'Channel code must be a string' })
  @IsNotEmpty({ message: 'Channel code cannot be empty' })
  @MaxLength(VALIDATION.MAX_CODE_LENGTH, {
    message: `Channel code cannot exceed ${VALIDATION.MAX_CODE_LENGTH} characters`,
  })
  @Matches(/^[A-Z0-9_]+$/i, {
    message: 'Channel code can only contain letters, numbers, and underscores',
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  channelCode!: string;

  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'Status must be either "active" or "inactive"',
  })
  channelStatus?: 'active' | 'inactive' = 'active';

  @IsOptional()
  @IsMongoId({ message: 'Project ID must be a valid MongoDB ObjectId' })
  projectId?: string;
}
