import {
  IsOptional,
  IsBoolean,
  IsNumber,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PAGINATION } from '@/common/constants/http-status.constants';

export class UserQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = PAGINATION.DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(PAGINATION.MAX_LIMIT, {
    message: `Limit cannot exceed ${PAGINATION.MAX_LIMIT}`,
  })
  limit?: number = PAGINATION.DEFAULT_LIMIT;

  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'Is active must be a boolean' })
  isActive?: boolean;
}
