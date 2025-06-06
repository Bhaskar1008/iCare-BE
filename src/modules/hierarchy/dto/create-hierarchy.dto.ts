import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsNumber,
  IsMongoId,
  Matches,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  VALIDATION,
  HIERARCHY,
} from '@/common/constants/http-status.constants';

export class CreateHierarchyDto {
  @IsString({ message: 'Channel ID must be a string' })
  @IsNotEmpty({ message: 'Channel ID cannot be empty' })
  @IsMongoId({ message: 'Channel ID must be a valid MongoDB ObjectId' })
  channelId!: string;

  @IsString({ message: 'Hierarchy name must be a string' })
  @IsNotEmpty({ message: 'Hierarchy name cannot be empty' })
  @MaxLength(VALIDATION.MAX_NAME_LENGTH, {
    message: `Hierarchy name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  hierarchyName!: string;

  @IsString({ message: 'Level code must be a string' })
  @IsNotEmpty({ message: 'Level code cannot be empty' })
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
  hierarchyLevelCode!: string;

  @IsNumber({}, { message: 'Level must be a number' })
  @Min(HIERARCHY.MIN_LEVEL, {
    message: `Hierarchy level must be at least ${HIERARCHY.MIN_LEVEL}`,
  })
  @Max(HIERARCHY.MAX_LEVEL, {
    message: `Hierarchy level cannot exceed ${HIERARCHY.MAX_LEVEL}`,
  })
  @Type(() => Number)
  hierarchyLevel!: number;

  @IsOptional()
  @IsString({ message: 'Parent ID must be a string' })
  @IsMongoId({ message: 'Parent ID must be a valid MongoDB ObjectId' })
  hierarchyParentId?: string;

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
  hierarchyOrder?: number = HIERARCHY.DEFAULT_ORDER;

  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'Status must be either "active" or "inactive"',
  })
  hierarchyStatus?: 'active' | 'inactive' = 'active';
}
