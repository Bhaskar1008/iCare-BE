import { IsOptional, IsNumberString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { PAGINATION } from '@/common/constants/http-status.constants';

export class ChannelQueryDto {
  @IsOptional()
  @IsNumberString({}, { message: 'Page must be a valid number' })
  @Transform(({ value }: { value: string }) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) {
      throw new Error('Page must be at least 1');
    }
    return value;
  })
  page?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'Limit must be a valid number' })
  @Transform(({ value }: { value: string }) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1 || num > PAGINATION.MAX_LIMIT) {
      throw new Error(`Limit must be between 1 and ${PAGINATION.MAX_LIMIT}`);
    }
    return value;
  })
  limit?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'Status must be either "active" or "inactive"',
  })
  status?: 'active' | 'inactive';
}
