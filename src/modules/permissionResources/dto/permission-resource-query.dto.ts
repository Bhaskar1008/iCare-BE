import {
  IsOptional,
  IsString,
  IsIn,
  IsNumberString,
  IsMongoId,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class PermissionResourceQueryDto {
  @IsOptional()
  @IsNumberString({}, { message: 'Page must be a valid number' })
  @Transform(({ value }): string => {
    if (typeof value === 'number') {
      return String(value);
    }
    return value as string;
  })
  page?: string = '1';

  @IsOptional()
  @IsNumberString({}, { message: 'Limit must be a valid number' })
  @Transform(({ value }): string => {
    if (typeof value === 'number') {
      return String(value);
    }
    return value as string;
  })
  limit?: string = '10';

  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'Status must be either "active" or "inactive"',
  })
  status?: 'active' | 'inactive';

  @IsOptional()
  @IsIn(['module', 'api', 'page', 'ui', 'feature'], {
    message: 'Type must be module, api, page, ui, or feature',
  })
  type?: 'module' | 'api' | 'page' | 'ui' | 'feature';

  @IsOptional()
  @IsMongoId({ message: 'Parent ID must be a valid MongoDB ObjectId' })
  parentId?: string;

  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;
}
