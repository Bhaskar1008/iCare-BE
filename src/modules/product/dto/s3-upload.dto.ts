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
  validateSync,
} from 'class-validator';

import { plainToInstance } from 'class-transformer';

/**
 * DTO for S3 Upload Request
 */
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

  @ValidateIf((o: S3UploadRequestDto) => o.isMultiple !== true)
  @IsOptional()
  @IsString({ message: 'File name must be a string' })
  fileName?: string;

  @ValidateIf((o: S3UploadRequestDto) => o.isMultiple === true)
  @IsOptional()
  @IsArray({ message: 'File names must be an array' })
  @ArrayMinSize(1, { message: 'At least one file name is required' })
  @IsString({ each: true, message: 'Each file name must be a string' })
  fileNames?: string[];

  @ValidateIf((o: S3UploadRequestDto) => o.isMultiple !== true)
  @IsOptional()
  @IsString({ message: 'Content type must be a string' })
  contentType?: string;

  @ValidateIf((o: S3UploadRequestDto) => o.isMultiple === true)
  @IsOptional()
  @IsArray({ message: 'Content types must be an array' })
  @ArrayMinSize(1, { message: 'At least one content type is required' })
  @IsString({ each: true, message: 'Each content type must be a string' })
  contentTypes?: string[];
}

/**
 * Single File Upload Result
 */
export interface S3UploadResult {
  fileKey: string;
  fileUrl: string;
}

/**
 * DTO for S3 Upload Response
 */
export class S3UploadResponseDto {
  @ValidateIf((o: S3UploadResponseDto) => !Array.isArray(o.files))
  @IsString({ message: 'File key must be a string' })
  fileKey?: string;

  @ValidateIf((o: S3UploadResponseDto) => !Array.isArray(o.files))
  @IsString({ message: 'File URL must be a string' })
  fileUrl?: string;

  @ValidateIf((o: S3UploadResponseDto) => Array.isArray(o.files))
  @IsArray({ message: 'Files must be an array of results' })
  files?: S3UploadResult[];
}

/**
 * Helper: Safely transform and validate incoming request body into S3UploadRequestDto
 * @throws {Error} If validation fails
 */
export function transformToS3UploadRequestDto(
  data: unknown,
): S3UploadRequestDto {
  const transformed = plainToInstance(S3UploadRequestDto, data);
  const errors = validateSync(transformed);

  if (errors.length > 0) {
    throw new Error(
      `Validation failed: ${errors
        .map(error => Object.values(error.constraints ?? {}))
        .flat()
        .join(', ')}`,
    );
  }

  return transformed;
}

/**
 * Helper: Safely transform and validate incoming response into S3UploadResponseDto
 * @throws {Error} If validation fails
 */
export function transformToS3UploadResponseDto(
  data: unknown,
): S3UploadResponseDto {
  const transformed = plainToInstance(S3UploadResponseDto, data);
  const errors = validateSync(transformed);

  if (errors.length > 0) {
    throw new Error(
      `Validation failed: ${errors
        .map(error => Object.values(error.constraints ?? {}))
        .flat()
        .join(', ')}`,
    );
  }

  return transformed;
}
