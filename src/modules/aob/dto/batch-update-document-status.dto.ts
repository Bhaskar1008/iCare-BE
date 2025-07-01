import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsIn,
  ValidateNested,
  IsOptional,
  IsMongoId,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DocumentStatusUpdateDto {
  @IsMongoId()
  @IsNotEmpty()
  _id!: string;

  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['approve', 'reject', 'qcReject', 'documentSubmitted'])
  documentStatus!: 'approve' | 'reject' | 'qcReject' | 'documentSubmitted';

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  infoName?: string;
}

export class BatchUpdateDocumentStatusDto {
  @IsString()
  @IsNotEmpty()
  applicationId!: string;

  @IsMongoId()
  @IsOptional()
  projectId?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one document is required' })
  @ValidateNested({ each: true })
  @Type(() => DocumentStatusUpdateDto)
  documents!: DocumentStatusUpdateDto[];
}
