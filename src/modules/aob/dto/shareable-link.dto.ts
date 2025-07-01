import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsEmail,
  ValidateIf,
} from 'class-validator';

export class ShareableLinkDto {
  @IsString()
  @IsNotEmpty({ message: 'Link is required' })
  link!: string;

  @IsString()
  @IsNotEmpty({ message: 'Notify type is required' })
  @IsIn(['email', 'sms'], {
    message: 'Notify type must be either email or sms',
  })
  notifyType!: 'email' | 'sms';

  @ValidateIf(o => o.notifyType === 'email')
  @IsEmail({}, { message: 'Email ID must be a valid email address' })
  @IsNotEmpty({ message: 'Email ID is required when notify type is email' })
  emailId?: string;

  @ValidateIf(o => o.notifyType === 'sms')
  @IsString()
  @IsNotEmpty({ message: 'SMS number is required when notify type is sms' })
  smsNo?: string;
}
