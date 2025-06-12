import {
  IsString,
  IsOptional,
  IsIn,
  IsMongoId,
  IsArray,
  IsUrl,
  MaxLength,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { VALIDATION } from '@/common/constants/http-status.constants';
import {
  ReasonsToBuyDto,
  ProductMediaDto,
  ProductFileDto,
} from './create-product.dto';

export class UpdateProductDto {
  @IsOptional()
  @IsString({ message: 'Product category ID must be a string' })
  @IsMongoId({
    message: 'Product category ID must be a valid MongoDB ObjectId',
  })
  productCategoryId?: string;

  @IsOptional()
  @IsArray({ message: 'Channel IDs must be an array' })
  @ArrayMinSize(1, { message: 'At least one channel must be selected' })
  @IsString({ each: true, message: 'Each channel ID must be a string' })
  @IsMongoId({
    each: true,
    message: 'Each channel ID must be a valid MongoDB ObjectId',
  })
  channelIds?: string[];

  @IsOptional()
  @IsString({ message: 'Product name must be a string' })
  @MaxLength(VALIDATION.MAX_NAME_LENGTH, {
    message: `Product name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
  })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  productName?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'Status must be either "active" or "inactive"',
  })
  status?: 'active' | 'inactive';

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

  @IsOptional()
  @ValidateNested()
  @Type(() => ReasonsToBuyDto)
  reasonsToBuy?: ReasonsToBuyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductMediaDto)
  media?: ProductMediaDto;

  @IsOptional()
  @IsArray({ message: 'Files must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ProductFileDto)
  files?: ProductFileDto[];
}
