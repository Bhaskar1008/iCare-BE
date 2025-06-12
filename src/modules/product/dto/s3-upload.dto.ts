import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsIn,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateIf,
  ArrayMinSize,
} from 'class-validator';

export class S3UploadRequestDto {
  @IsString({ message: 'User ID must be a string' })
  @IsNotEmpty({ message: 'User ID cannot be empty' })
  @IsMongoId({ message: 'User ID must be a valid MongoDB ObjectId' })
  userId!: string;

  @IsString({ message: 'File type must be a string' })
  @IsIn(['video', 'image', 'document'], {
    message: 'File type must be either video, image, or document',
  })
  fileType!: 'video' | 'image' | 'document';

  @IsOptional()
  @IsBoolean({ message: 'isMultiple must be a boolean' })
  isMultiple?: boolean;

  @ValidateIf(o => !o.isMultiple)
  @IsOptional()
  @IsString({ message: 'File name must be a string' })
  fileName?: string;

  @ValidateIf(o => o.isMultiple)
  @IsOptional()
  @IsArray({ message: 'File names must be an array' })
  @ArrayMinSize(1, { message: 'At least one file name is required' })
  @IsString({ each: true, message: 'Each file name must be a string' })
  fileNames?: string[];

  @ValidateIf(o => !o.isMultiple)
  @IsOptional()
  @IsString({ message: 'Content type must be a string' })
  contentType?: string;

  @ValidateIf(o => o.isMultiple)
  @IsOptional()
  @IsArray({ message: 'Content types must be an array' })
  @ArrayMinSize(1, { message: 'At least one content type is required' })
  @IsString({ each: true, message: 'Each content type must be a string' })
  contentTypes?: string[];
}

export interface S3UploadResult {
  fileKey: string;
  fileUrl: string;
}

export class S3UploadResponseDto {
  @ValidateIf(o => !o.files)
  @IsString()
  fileKey?: string;

  @ValidateIf(o => !o.files)
  @IsString()
  fileUrl?: string;

  @ValidateIf(o => o.files)
  @IsArray()
  files?: S3UploadResult[];
}
