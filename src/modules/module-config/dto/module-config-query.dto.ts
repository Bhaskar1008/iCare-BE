import { IsOptional, IsString, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';

export class ModuleConfigQueryDto {
  @IsOptional()
  @IsMongoId()
  moduleId?: string;

  @IsOptional()
  @IsMongoId()
  projectId?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  configName?: string;
}
