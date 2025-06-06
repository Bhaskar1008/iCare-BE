import { IsString, IsOptional, IsIn, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateChannelDto {
  @IsOptional()
  @IsString({ message: 'Channel name must be a string' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  channelName?: string;

  @IsOptional()
  @IsString({ message: 'Channel code must be a string' })
  @Matches(/^[A-Z0-9_]+$/i, {
    message: 'Channel code can only contain letters, numbers, and underscores',
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  channelCode?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'Status must be either "active" or "inactive"',
  })
  channelStatus?: 'active' | 'inactive';
}
