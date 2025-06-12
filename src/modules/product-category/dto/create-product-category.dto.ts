import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsNumber,
  IsMongoId,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { VALIDATION } from '@/common/constants/http-status.constants';

export class CreateProductCategoryDto {
  @IsString({ message: 'Category name must be a string' })
  @IsNotEmpty({ message: 'Category name cannot be empty' })
  @MaxLength(VALIDATION.MAX_NAME_LENGTH, {
    message: `Category name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  categoryName!: string;

  @IsOptional()
  @IsNumber({}, { message: 'Sequence number must be a number' })
  @Min(0, { message: 'Sequence number cannot be negative' })
  @Type(() => Number)
  sequenceNumber?: number = 0;

  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'Status must be either "active" or "inactive"',
  })
  status?: 'active' | 'inactive' = 'active';

  @IsString({ message: 'Created by must be a string' })
  @IsNotEmpty({ message: 'Created by cannot be empty' })
  @IsMongoId({ message: 'Created by must be a valid MongoDB ObjectId' })
  createdBy!: string;
}
