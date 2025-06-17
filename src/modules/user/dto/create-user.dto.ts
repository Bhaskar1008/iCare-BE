import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsBoolean,
  MaxLength,
  MinLength,
  IsEnum,
  IsMongoId,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { VALIDATION } from '@/common/constants/http-status.constants';

export class CreateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  @MaxLength(VALIDATION.MAX_RESOURCE_IDENTIFIER_LENGTH, {
    message: `Email cannot exceed ${VALIDATION.MAX_RESOURCE_IDENTIFIER_LENGTH} characters`,
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  email!: string;

  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name cannot be empty' })
  @MaxLength(VALIDATION.MAX_NAME_LENGTH, {
    message: `First name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  firstName!: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name cannot be empty' })
  @MaxLength(VALIDATION.MAX_NAME_LENGTH, {
    message: `Last name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  lastName!: string;

  @IsOptional()
  @IsBoolean({ message: 'Is active must be a boolean' })
  isActive?: boolean = true;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @MinLength(VALIDATION.MIN_PASSWORD_LENGTH, {
    message: `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters long`,
  })
  password!: string;

  @IsOptional()
  @IsEnum(['user', 'admin', 'superadmin'], {
    message: 'Role must be one of: user, admin, superadmin',
  })
  role?: 'user' | 'admin' | 'superadmin' = 'user';

  @ValidateIf(o => o.role === 'user')
  @IsMongoId({ message: 'Project ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'Project ID is required for users with role "user"' })
  projectId?: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
  role?: 'user' | 'admin' | 'superadmin';
  projectId?: string;
}
