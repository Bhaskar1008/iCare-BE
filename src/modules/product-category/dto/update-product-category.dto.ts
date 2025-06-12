import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { VALIDATION } from '@/common/constants/http-status.constants';

export class UpdateProductCategoryDto {
  @IsOptional()
  @IsString({ message: 'Category name must be a string' })
  @MaxLength(VALIDATION.MAX_NAME_LENGTH, {
    message: `Category name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  categoryName?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Sequence number must be a number' })
  @Min(0, { message: 'Sequence number cannot be negative' })
  @Type(() => Number)
  sequenceNumber?: number;

  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'Status must be either "active" or "inactive"',
  })
  status?: 'active' | 'inactive';
}
