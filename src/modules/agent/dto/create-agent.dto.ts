import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  Matches,
  MaxLength,
  IsMongoId,
  IsNumber,
  IsBoolean,
  IsEmail,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { VALIDATION } from '@/common/constants/http-status.constants';

const MAX_COMMISSION_PERCENTAGE = 100;

export class CreateAgentDto {
  @IsMongoId({ message: 'User ID must be a valid ID' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId!: string;

  @IsMongoId({ message: 'Channel ID must be a valid ID' })
  @IsNotEmpty({ message: 'Channel ID is required' })
  channelId!: string;

  @IsMongoId({ message: 'Designation ID must be a valid ID' })
  @IsNotEmpty({ message: 'Designation ID is required' })
  designationId!: string;

  @IsString({ message: 'Agent code must be a string' })
  @IsNotEmpty({ message: 'Agent code is required' })
  @MaxLength(VALIDATION.MAX_CODE_LENGTH, {
    message: `Agent code cannot exceed ${VALIDATION.MAX_CODE_LENGTH} characters`,
  })
  @Matches(/^[A-Z0-9_]+$/i, {
    message: 'Agent code can only contain letters, numbers, and underscores',
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  agentCode!: string;

  @IsOptional()
  @IsString({ message: 'Employee ID must be a string' })
  @MaxLength(VALIDATION.MAX_CODE_LENGTH, {
    message: `Employee ID cannot exceed ${VALIDATION.MAX_CODE_LENGTH} characters`,
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  employeeId?: string;

  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MaxLength(VALIDATION.MAX_NAME_LENGTH, {
    message: `First name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(VALIDATION.MAX_NAME_LENGTH, {
    message: `Last name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  lastName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email?: string;

  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^(\+\d{1,3}[- ]?)?\d{5,15}$/, {
    message: 'Please enter a valid phone number',
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  phoneNumber?: string;

  @IsOptional()
  @IsIn(['active', 'inactive', 'suspended'], {
    message: 'Status must be either "active", "inactive", or "suspended"',
  })
  agentStatus?: 'active' | 'inactive' | 'suspended' = 'active';

  @IsOptional()
  @IsDateString({}, { message: 'Joining date must be a valid date' })
  joiningDate?: string;

  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'Target amount must be a number' },
  )
  @Min(0, { message: 'Target amount cannot be negative' })
  targetAmount?: number;

  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'Commission percentage must be a number' },
  )
  @Min(0, { message: 'Commission percentage cannot be negative' })
  @Max(MAX_COMMISSION_PERCENTAGE, {
    message: `Commission percentage cannot exceed ${MAX_COMMISSION_PERCENTAGE}`,
  })
  commissionPercentage?: number;

  @IsOptional()
  @IsBoolean({ message: 'isTeamLead must be a boolean' })
  isTeamLead?: boolean = false;

  @IsOptional()
  @IsMongoId({ message: 'Team lead ID must be a valid ID' })
  teamLeadId?: string;

  @IsOptional()
  @IsMongoId({ message: 'Reporting manager ID must be a valid ID' })
  reportingManagerId?: string;
}
