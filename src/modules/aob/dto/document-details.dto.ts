import { IsString, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';

export class DocumentDetailsQueryDto {
  @IsString()
  @IsNotEmpty()
  applicationId!: string;

  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsMongoId()
  @IsOptional()
  projectId?: string;
}
