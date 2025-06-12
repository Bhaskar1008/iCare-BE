import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  Matches,
  MaxLength,
  IsNumber,
  Min,
  IsMongoId,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { VALIDATION } from '@/common/constants/http-status.constants';

export class CreateDesignationDto {
  @IsMongoId({ message: 'Channel ID must be a valid MongoDB ID' })
  @IsNotEmpty({ message: 'Channel ID cannot be empty' })
  channelId!: string;

  @IsMongoId({ message: 'Role ID must be a valid MongoDB ID' })
  @IsNotEmpty({ message: 'Role ID cannot be empty' })
  roleId!: string;

  @IsMongoId({ message: 'Hierarchy ID must be a valid MongoDB ID' })
  @IsNotEmpty({ message: 'Hierarchy ID cannot be empty' })
  hierarchyId!: string;

  @IsString({ message: 'Designation name must be a string' })
  @IsNotEmpty({ message: 'Designation name cannot be empty' })
  @MaxLength(VALIDATION.MAX_NAME_LENGTH, {
    message: `Designation name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  designationName!: string;

  @IsString({ message: 'Designation code must be a string' })
  @IsNotEmpty({ message: 'Designation code cannot be empty' })
  @MaxLength(VALIDATION.MAX_CODE_LENGTH, {
    message: `Designation code cannot exceed ${VALIDATION.MAX_CODE_LENGTH} characters`,
  })
  @Matches(/^[A-Z0-9_]+$/i, {
    message:
      'Designation code can only contain uppercase letters, numbers, and underscores',
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  designationCode!: string;

  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'Status must be either "active" or "inactive"',
  })
  designationStatus?: 'active' | 'inactive' = 'active';

  @IsOptional()
  @IsString({ message: 'Designation description must be a string' })
  @MaxLength(VALIDATION.MAX_DESCRIPTION_LENGTH, {
    message: `Designation description cannot exceed ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters`,
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  designationDescription?: string;

  @IsNumber({}, { message: 'Designation order must be a number' })
  @Min(0, { message: 'Designation order cannot be negative' })
  @IsOptional()
  designationOrder?: number = 0;
}
