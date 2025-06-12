import { IsOptional, IsString, IsIn, IsNumberString } from 'class-validator';
import { Transform } from 'class-transformer';

export class PermissionQueryDto {
  @IsOptional()
  @IsNumberString({}, { message: 'Page must be a valid number' })
  @Transform(({ value }): string => {
    if (typeof value === 'number') {
      return String(value);
    }
    return value as string;
  })
  page?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'Limit must be a valid number' })
  @Transform(({ value }): string => {
    if (typeof value === 'number') {
      return String(value);
    }
    return value as string;
  })
  limit?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'Status must be either "active" or "inactive"',
  })
  status?: 'active' | 'inactive';

  @IsOptional()
  @IsIn(['allow', 'deny'], {
    message: 'Effect must be either "allow" or "deny"',
  })
  effect?: 'allow' | 'deny';

  @IsOptional()
  @IsString({ message: 'Resource ID must be a string' })
  resourceId?: string;

  @IsOptional()
  @IsIn(
    [
      'create',
      'read',
      'update',
      'delete',
      'view',
      'edit',
      'publish',
      'approve',
      'reject',
      'export',
      'import',
      'share',
      'download',
      'upload',
      'admin',
      'manage',
      '*',
    ],
    {
      message: 'Action must be one of the defined values',
    },
  )
  action?:
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | 'view'
    | 'edit'
    | 'publish'
    | 'approve'
    | 'reject'
    | 'export'
    | 'import'
    | 'share'
    | 'download'
    | 'upload'
    | 'admin'
    | 'manage'
    | '*';
}
