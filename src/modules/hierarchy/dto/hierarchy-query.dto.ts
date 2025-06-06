import {
  IsOptional,
  IsString,
  IsNumber,
  IsIn,
  IsMongoId,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  PAGINATION,
  HIERARCHY,
} from '@/common/constants/http-status.constants';

export class HierarchyQueryDto {
  @IsOptional()
  @IsString({ message: 'Channel ID must be a string' })
  @IsMongoId({ message: 'Channel ID must be a valid MongoDB ObjectId' })
  channelId?: string;

  @IsOptional()
  @IsString({ message: 'Parent ID must be a string' })
  @IsMongoId({ message: 'Parent ID must be a valid MongoDB ObjectId' })
  hierarchyParentId?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Level must be a number' })
  @Min(HIERARCHY.MIN_LEVEL, {
    message: `Level must be at least ${HIERARCHY.MIN_LEVEL}`,
  })
  @Max(HIERARCHY.MAX_LEVEL, {
    message: `Level cannot exceed ${HIERARCHY.MAX_LEVEL}`,
  })
  @Type(() => Number)
  hierarchyLevel?: number;

  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'Status must be either "active" or "inactive"',
  })
  hierarchyStatus?: 'active' | 'inactive';

  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  @Type(() => Number)
  page?: number = PAGINATION.DEFAULT_PAGE;

  @IsOptional()
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(PAGINATION.MAX_LIMIT, {
    message: `Limit cannot exceed ${PAGINATION.MAX_LIMIT}`,
  })
  @Type(() => Number)
  limit?: number = PAGINATION.DEFAULT_LIMIT;

  @IsOptional()
  @IsIn(['hierarchyName', 'hierarchyLevel', 'hierarchyOrder', 'createdAt'], {
    message:
      'Sort field must be one of: hierarchyName, hierarchyLevel, hierarchyOrder, createdAt',
  })
  sortBy?: 'hierarchyName' | 'hierarchyLevel' | 'hierarchyOrder' | 'createdAt' =
    'hierarchyOrder';

  @IsOptional()
  @IsIn(['asc', 'desc'], {
    message: 'Sort order must be either "asc" or "desc"',
  })
  sortOrder?: 'asc' | 'desc' = 'asc';

  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    if (value === undefined || value === null || value === '') return false;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({
    message: 'includeDeleted must be either "true" or "false"',
  })
  includeDeleted?: boolean = false;
}
