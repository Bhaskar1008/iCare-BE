import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsMongoId,
  IsObject,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePermissionDto {
  @IsString({ message: 'Resource ID must be a string' })
  @IsNotEmpty({ message: 'Resource ID cannot be empty' })
  @IsMongoId({ message: 'Resource ID must be a valid MongoDB ObjectId' })
  resourceId!: string;

  @IsString({ message: 'Action must be a string' })
  @IsNotEmpty({ message: 'Action cannot be empty' })
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
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  action!:
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

  @IsOptional()
  @IsIn(['allow', 'deny'], {
    message: 'Effect must be either "allow" or "deny"',
  })
  effect?: 'allow' | 'deny' = 'allow';

  @IsOptional()
  @IsObject({ message: 'Conditions must be an object' })
  conditions?: Record<string, unknown>;

  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'Status must be either "active" or "inactive"',
  })
  status?: 'active' | 'inactive' = 'active';
}
