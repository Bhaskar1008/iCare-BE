import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  Matches,
  MaxLength,
  IsMongoId,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { VALIDATION } from '@/common/constants/http-status.constants';

export class CreatePermissionResourceDto {
  @IsString({ message: 'Resource name must be a string' })
  @IsNotEmpty({ message: 'Resource name cannot be empty' })
  @MaxLength(VALIDATION.MAX_RESOURCE_NAME_LENGTH, {
    message: `Resource name cannot exceed ${VALIDATION.MAX_RESOURCE_NAME_LENGTH} characters`,
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name!: string;

  @IsString({ message: 'Resource identifier must be a string' })
  @IsNotEmpty({ message: 'Resource identifier cannot be empty' })
  @MaxLength(VALIDATION.MAX_RESOURCE_IDENTIFIER_LENGTH, {
    message: `Resource identifier cannot exceed ${VALIDATION.MAX_RESOURCE_IDENTIFIER_LENGTH} characters`,
  })
  @Matches(/^[a-z][a-z0-9._-]*$/, {
    message:
      'Identifier must start with a letter and contain only lowercase letters, numbers, dots, underscores, and hyphens',
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  identifier!: string;

  @IsString({ message: 'Resource type must be a string' })
  @IsNotEmpty({ message: 'Resource type cannot be empty' })
  @IsIn(['module', 'api', 'page', 'ui', 'feature'], {
    message: 'Type must be module, api, page, ui, or feature',
  })
  type!: 'module' | 'api' | 'page' | 'ui' | 'feature';

  @IsOptional()
  @IsMongoId({ message: 'Parent ID must be a valid MongoDB ObjectId' })
  parentId?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'Status must be either "active" or "inactive"',
  })
  status?: 'active' | 'inactive' = 'active';
}
