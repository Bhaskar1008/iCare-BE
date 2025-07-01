import { IsString, IsArray, IsNotEmpty, IsEmail } from 'class-validator';

export class ResourceCenterShareableLinkDto {
  @IsString()
  @IsNotEmpty()
  link!: string;

  @IsArray()
  @IsEmail({}, { each: true })
  mails!: string[];
}
