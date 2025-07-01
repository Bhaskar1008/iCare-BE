import { IsOptional, IsNumberString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PAGINATION } from '@/common/constants/http-status.constants';

export class LeadQueryDto {
  @IsOptional()
  @IsNumberString({}, { message: 'Page must be a valid number' })
  @Transform(({ value }: { value: string }) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) {
      throw new Error('Page must be at least 1');
    }
    return value;
  })
  page?: string = '1';

  @IsOptional()
  @IsNumberString({}, { message: 'Limit must be a valid number' })
  @Transform(({ value }: { value: string }) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1 || num > PAGINATION.MAX_LIMIT) {
      throw new Error(`Limit must be between 1 and ${PAGINATION.MAX_LIMIT}`);
    }
    return value;
  })
  limit?: string = '10';
}

// We don't need to validate createdBy in the query params
// since it's a path parameter and will be validated in the controller
export class LeadCreatorQueryDto extends LeadQueryDto {
  // Removed the createdBy validation here since it's a path parameter
}
