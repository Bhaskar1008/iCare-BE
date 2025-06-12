import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsMongoId,
  IsArray,
  IsUrl,
  MaxLength,
  ValidateNested,
  ArrayMinSize,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { VALIDATION } from '@/common/constants/http-status.constants';

export class ReasonsToBuyDto {
  @IsString({ message: 'First reason must be a string' })
  @IsNotEmpty({ message: 'First reason cannot be empty' })
  @MaxLength(300, { message: 'Reason cannot exceed 300 characters' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  reason1!: string;

  @IsString({ message: 'Second reason must be a string' })
  @IsNotEmpty({ message: 'Second reason cannot be empty' })
  @MaxLength(300, { message: 'Reason cannot exceed 300 characters' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  reason2!: string;

  @IsOptional()
  @IsString({ message: 'Third reason must be a string' })
  @MaxLength(300, { message: 'Reason cannot exceed 300 characters' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  reason3?: string;

  @IsOptional()
  @IsString({ message: 'Fourth reason must be a string' })
  @MaxLength(300, { message: 'Reason cannot exceed 300 characters' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  reason4?: string;

  @IsOptional()
  @IsString({ message: 'Fifth reason must be a string' })
  @MaxLength(300, { message: 'Reason cannot exceed 300 characters' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  reason5?: string;
}

export class ProductVideoDto {
  @IsString({ message: 'Video title must be a string' })
  @IsNotEmpty({ message: 'Video title cannot be empty' })
  @MaxLength(100, { message: 'Video title cannot exceed 100 characters' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  title!: string;

  @IsOptional()
  @IsArray({ message: 'S3 links must be an array' })
  @IsString({ each: true, message: 'Each S3 link must be a string' })
  s3Links?: string[] = [];

  @IsOptional()
  @IsUrl({}, { message: 'YouTube URL must be a valid URL' })
  youtubeUrl?: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  @Transform(({ value }) => {
    if (value === undefined || value === null) return true;
    return Boolean(value);
  })
  isActive: boolean = true;
}

export class ProductImageDto {
  @IsString({ message: 'Image title must be a string' })
  @IsNotEmpty({ message: 'Image title cannot be empty' })
  @MaxLength(100, { message: 'Image title cannot exceed 100 characters' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  title!: string;

  @IsString({ message: 'S3 link must be a string' })
  @IsNotEmpty({ message: 'S3 link cannot be empty' })
  s3Link!: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  @Transform(({ value }) => {
    if (value === undefined || value === null) return true;
    return Boolean(value);
  })
  isActive: boolean = true;
}

export class ProductFileDto {
  @IsString({ message: 'Category ID must be a string' })
  @IsNotEmpty({ message: 'Category ID cannot be empty' })
  @IsMongoId({ message: 'Category ID must be a valid MongoDB ObjectId' })
  categoryId!: string;

  @IsString({ message: 'File type must be a string' })
  @IsIn(['PDF', 'PPT'], { message: 'File type must be either PDF or PPT' })
  fileType!: 'PDF' | 'PPT';

  @IsString({ message: 'Language must be a string' })
  @IsNotEmpty({ message: 'Language cannot be empty' })
  @MaxLength(50, { message: 'Language cannot exceed 50 characters' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  language!: string;

  @IsString({ message: 'Brochure name must be a string' })
  @IsNotEmpty({ message: 'Brochure name cannot be empty' })
  @MaxLength(100, { message: 'Brochure name cannot exceed 100 characters' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  brochureName!: string;

  @IsString({ message: 'S3 link must be a string' })
  @IsNotEmpty({ message: 'S3 link cannot be empty' })
  s3Link!: string;
}

export class ProductMediaDto {
  @IsOptional()
  @IsArray({ message: 'Videos must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ProductVideoDto)
  videos?: ProductVideoDto[];

  @IsOptional()
  @IsArray({ message: 'Images must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];
}

export class CreateProductDto {
  @IsString({ message: 'Product category ID must be a string' })
  @IsNotEmpty({ message: 'Product category ID cannot be empty' })
  @IsMongoId({
    message: 'Product category ID must be a valid MongoDB ObjectId',
  })
  productCategoryId!: string;

  @IsArray({ message: 'Channel IDs must be an array' })
  @ArrayMinSize(1, { message: 'At least one channel must be selected' })
  @IsString({ each: true, message: 'Each channel ID must be a string' })
  @IsMongoId({
    each: true,
    message: 'Each channel ID must be a valid MongoDB ObjectId',
  })
  channelIds!: string[];

  @IsString({ message: 'Product name must be a string' })
  @IsNotEmpty({ message: 'Product name cannot be empty' })
  @MaxLength(VALIDATION.MAX_NAME_LENGTH, {
    message: `Product name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  productName!: string;

  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'Status must be either "active" or "inactive"',
  })
  status?: 'active' | 'inactive' = 'active';

  @IsOptional()
  @IsUrl({}, { message: 'Web link must be a valid URL' })
  webLink?: string;

  @IsOptional()
  @IsString({ message: 'Application ID must be a string' })
  @MaxLength(50, { message: 'Application ID cannot exceed 50 characters' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  applicationId?: string;

  @IsOptional()
  @IsString({ message: 'Product description must be a string' })
  @MaxLength(VALIDATION.MAX_DESCRIPTION_LENGTH, {
    message: `Product description cannot exceed ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters`,
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  productDescription?: string;

  @ValidateNested()
  @Type(() => ReasonsToBuyDto)
  reasonsToBuy!: ReasonsToBuyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductMediaDto)
  media?: ProductMediaDto;

  @IsOptional()
  @IsArray({ message: 'Files must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ProductFileDto)
  files?: ProductFileDto[];

  @IsString({ message: 'Created by must be a string' })
  @IsNotEmpty({ message: 'Created by cannot be empty' })
  @IsMongoId({ message: 'Created by must be a valid MongoDB ObjectId' })
  createdBy!: string;
}
