import {
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class BulkAgentUploadDto {
  @IsMongoId({ message: 'Project ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'Project ID is required' })
  projectId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  batchSize?: number;
}

export interface AgentExcelRow {
  'Agent Code'?: string;
  'Agent First Name': string;
  'Agent Last Name': string;
  Email: string;
  'Mobile Number': string;
  Channel: string;
  Designation: string;
  Branch?: string;
  'Appointment Date'?: string;
  'CA Number'?: string;
  Province?: string;
  City?: string;
  'Pin Code'?: string;
  Status?: string;
  'Reporting Manager ID'?: string;
  TIN?: string;
}

export interface BulkAgentValidationResult {
  valid: boolean;
  rowIndex: number;
  data?: Record<string, any>;
  errors?: string[];
}

export interface BulkAgentUploadResult {
  success: boolean;
  message: string;
  totalRecords: number;
  successCount: number;
  failedCount: number;
  validationResults: BulkAgentValidationResult[];
  createdAgents?: any[];
}
