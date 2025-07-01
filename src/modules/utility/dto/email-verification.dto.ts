import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class EmailVerificationDto {
  @IsString({ message: 'Email must be a string' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  emailId!: string;

  @IsOptional()
  @IsString({ message: 'OTP must be a string' })
  @Length(4, 4, { message: 'OTP must be 4 characters long' })
  otp?: string;
}
