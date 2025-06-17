import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PAGINATION } from '@/common/constants/http-status.constants';

export class ProjectQueryDto {
  @IsString()
  @IsOptional()
  projectName?: string;

  @IsString()
  @IsOptional()
  projectCode?: string;

  @IsEnum(['active', 'inactive'])
  @IsOptional()
  projectStatus?: 'active' | 'inactive';

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = PAGINATION.DEFAULT_PAGE;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = PAGINATION.DEFAULT_LIMIT;

  @IsString()
  @IsOptional()
  @IsIn([
    'projectName',
    'projectCode',
    'projectStatus',
    'createdAt',
    'updatedAt',
  ])
  sortBy?: string = 'createdAt';

  @IsString()
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
