import { IsString, IsOptional, IsIn, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';

export class DesignationQueryDto {
  @IsOptional()
  @IsString({ message: 'Page must be a string' })
  @Transform(({ value }: { value: string }) => {
    const parsedValue = parseInt(value, 10);
    return isNaN(parsedValue) ? '1' : String(parsedValue);
  })
  page?: string;

  @IsOptional()
  @IsString({ message: 'Limit must be a string' })
  @Transform(({ value }: { value: string }) => {
    const parsedValue = parseInt(value, 10);
    return isNaN(parsedValue) ? '10' : String(parsedValue);
  })
  limit?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'Status must be either "active" or "inactive"',
  })
  status?: 'active' | 'inactive';

  @IsOptional()
  @IsMongoId({ message: 'Channel ID must be a valid MongoDB ID' })
  channelId?: string;

  @IsOptional()
  @IsMongoId({ message: 'Role ID must be a valid MongoDB ID' })
  roleId?: string;

  @IsOptional()
  @IsMongoId({ message: 'Hierarchy ID must be a valid MongoDB ID' })
  hierarchyId?: string;
}
