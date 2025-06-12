import {
  IsOptional,
  IsIn,
  IsString,
  IsBoolean,
  IsMongoId,
  IsNumberString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RoleQueryDto {
  @IsOptional()
  @IsNumberString({}, { message: 'Page must be a number' })
  page?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'Limit must be a number' })
  limit?: string;

  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'Status must be either "active" or "inactive"',
  })
  status?: 'active' | 'inactive';

  @IsOptional()
  @IsMongoId({ message: 'Channel ID must be a valid MongoDB ObjectId' })
  channelId?: string;

  @IsOptional()
  @IsBoolean({ message: 'Is system must be a boolean' })
  @Transform(({ value }: { value: string }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isSystem?: boolean;
}
