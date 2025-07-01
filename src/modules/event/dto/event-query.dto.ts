import { IsOptional, IsNumberString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { PAGINATION } from '@/common/constants/http-status.constants';

export class EventQueryDto {
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
  @IsIn(['SCHEDULED', 'CANCELLED', 'COMPLETED', 'RESCHEDULED', 'IN_PROGRESS'], {
    message:
      'Status must be either "SCHEDULED", "CANCELLED", "COMPLETED", "RESCHEDULED", or "IN_PROGRESS"',
  })
  status?:
    | 'SCHEDULED'
    | 'CANCELLED'
    | 'COMPLETED'
    | 'RESCHEDULED'
    | 'IN_PROGRESS';

  @IsOptional()
  startDateTime?: string;

  @IsOptional()
  endDateTime?: string;

  @IsOptional()
  createdBy?: string;

  @IsOptional()
  eventWith?: string;

  @IsOptional()
  type?: string;
}
