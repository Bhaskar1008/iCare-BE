import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  IsBoolean,
  IsArray,
  IsMongoId,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { VALIDATION } from '@/common/constants/http-status.constants';

export class UpdateRoleDto {
  @IsOptional()
  @IsString({ message: 'Role name must be a string' })
  @MaxLength(VALIDATION.MAX_RESOURCE_NAME_LENGTH, {
    message: `Role name cannot exceed ${VALIDATION.MAX_RESOURCE_NAME_LENGTH} characters`,
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  roleName?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Role code must be a number' })
  @Type(() => Number)
  @Min(1, { message: 'Role code must be positive' })
  @Max(VALIDATION.MAX_ROLE_ORDER, {
    message: `Role code cannot exceed ${VALIDATION.MAX_ROLE_ORDER}`,
  })
  roleCode?: number;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(VALIDATION.MAX_DESCRIPTION_LENGTH, {
    message: `Description cannot exceed ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters`,
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  description?: string;

  @IsOptional()
  @IsArray({ message: 'Permissions must be an array' })
  @IsMongoId({
    each: true,
    message: 'Each permission must be a valid MongoDB ObjectId',
  })
  permissions?: string[];

  @IsOptional()
  @IsBoolean({ message: 'Is system must be a boolean' })
  isSystem?: boolean;

  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'Status must be either "active" or "inactive"',
  })
  status?: 'active' | 'inactive';
}
