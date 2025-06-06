import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  VALIDATION,
  HIERARCHY,
} from '@/common/constants/http-status.constants';

export class UpdateHierarchyDto {
  @IsOptional()
  @IsString({ message: 'Hierarchy name must be a string' })
  @MaxLength(VALIDATION.MAX_NAME_LENGTH, {
    message: `Hierarchy name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  hierarchyName?: string;

  @IsOptional()
  @IsString({ message: 'Level code must be a string' })
  @MaxLength(VALIDATION.MAX_CODE_LENGTH, {
    message: `Level code cannot exceed ${VALIDATION.MAX_CODE_LENGTH} characters`,
  })
  @Matches(/^[A-Z0-9_]+$/, {
    message:
      'Level code can only contain uppercase letters, numbers, and underscores',
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  hierarchyLevelCode?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(VALIDATION.MAX_DESCRIPTION_LENGTH, {
    message: `Description cannot exceed ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters`,
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  hierarchyDescription?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Order must be a number' })
  @Min(HIERARCHY.DEFAULT_ORDER, {
    message: 'Order cannot be negative',
  })
  @Type(() => Number)
  hierarchyOrder?: number;

  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'Status must be either "active" or "inactive"',
  })
  hierarchyStatus?: 'active' | 'inactive';
}
