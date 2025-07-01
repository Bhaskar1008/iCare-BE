import {
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class BulkLeadUploadDto {
  @IsMongoId({ message: 'Project ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'Project ID is required' })
  projectId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  batchSize?: number;
}

export interface LeadExcelRow {
  AGENT_ID: string;
  FIRST_NAME: string;
  LAST_NAME: string;
  Province: string;
  CITY: string;
  EMAIL: string;
  CONTACT_NO: string;
  LEAD_TYPE: string;
  LEAD_STAGE: string;
  REMARKS?: string;
}

export interface BulkLeadValidationResult {
  valid: boolean;
  rowIndex: number;
  data?: Record<string, any>;
  errors?: string[];
}

export interface BulkLeadUploadResult {
  success: boolean;
  message: string;
  totalRecords: number;
  successCount: number;
  failedCount: number;
  validationResults: BulkLeadValidationResult[];
  createdLeads?: any[];
}
