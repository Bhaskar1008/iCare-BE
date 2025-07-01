import { read as readXlsxBuffer, utils as xlsxUtils } from 'xlsx';
import { Types } from 'mongoose';
import { BadRequestException } from '@/common/exceptions/bad-request.exception';
import { leadService } from '../lead.service';
import { AgentModel } from '@/models/agent.model';
import { ProjectModel } from '@/models/project.model';
import type { LeadExcelRow } from '../dto/bulk-lead-upload.dto';
import type { ILead } from '@/models/lead.model';
import { determineLeadStatus } from '../lead.config';
import { Lead } from '@/models/lead.model';

interface ValidationError {
  row: number;
  error: string;
  field: string;
  data: Record<string, any>;
  existingLeadId?: string;
}

interface ProcessResult {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  batchSize: number;
  errors: ValidationError[];
  createdLeads: Array<{
    leadId: string;
    email: string;
    name: string;
    status: string;
  }>;
}

export class BulkLeadUploadService {
  async processExcelFile(
    fileBuffer: Buffer,
    projectId: string,
    batchSize = 100,
  ): Promise<ProcessResult> {
    const workbook = readXlsxBuffer(fileBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsxUtils.sheet_to_json<LeadExcelRow>(worksheet);

    const result: ProcessResult = {
      totalProcessed: rows.length,
      successCount: 0,
      failureCount: 0,
      batchSize,
      errors: [],
      createdLeads: [],
    };

    // Validate project exists
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw new BadRequestException('Project not found');
    }

    // Process in batches
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      await this.processBatch(batch, result, projectId, i);
    }

    return result;
  }

  private async processBatch(
    batch: LeadExcelRow[],
    result: ProcessResult,
    projectId: string,
    startIndex: number,
  ): Promise<void> {
    for (let i = 0; i < batch.length; i++) {
      const row = batch[i];
      const rowIndex = startIndex + i + 2; // +2 for Excel row number (header + 1-based)

      try {
        const validationErrors = await this.validateRow(row, rowIndex);
        if (validationErrors.length > 0) {
          result.errors.push(...validationErrors);
          result.failureCount++;
          continue;
        }

        const lead = await this.createLeadFromRow(row, projectId);
        result.createdLeads.push({
          leadId: lead._id.toString(),
          email: lead.emailAddress,
          name: `${lead.firstName} ${lead.lastName}`,
          status: lead.currentLeadStatus?.name || 'New',
        });
        result.successCount++;
      } catch (error) {
        if (error instanceof Error) {
          result.errors.push({
            row: rowIndex,
            error: error.message,
            field: 'General',
            data: row,
          });
        } else {
          result.errors.push({
            row: rowIndex,
            error: 'An unknown error occurred',
            field: 'General',
            data: row,
          });
        }
        result.failureCount++;
      }
    }
  }

  private async validateRow(
    row: LeadExcelRow,
    rowIndex: number,
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Check required fields
    const requiredFields = [
      'AGENT_ID',
      'FIRST_NAME',
      'LAST_NAME',
      'Province',
      'CITY',
      'EMAIL',
      'CONTACT_NO',
      'LEAD_TYPE',
      'LEAD_STAGE',
    ];

    for (const field of requiredFields) {
      if (!row[field as keyof LeadExcelRow]) {
        errors.push({
          row: rowIndex,
          error: `${field} is required`,
          field,
          data: row,
        });
      }
    }

    if (errors.length > 0) return errors;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.EMAIL)) {
      errors.push({
        row: rowIndex,
        error: 'Invalid email format',
        field: 'EMAIL',
        data: row,
      });
    }

    // Check for duplicate email
    const existingLeadByEmail = await Lead.findOne({ emailAddress: row.EMAIL });
    if (existingLeadByEmail) {
      errors.push({
        row: rowIndex,
        error: 'Email already exists in the system',
        field: 'EMAIL',
        data: row,
        existingLeadId: existingLeadByEmail._id.toString(),
      });
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(row.CONTACT_NO)) {
      errors.push({
        row: rowIndex,
        error: 'Invalid phone number format',
        field: 'CONTACT_NO',
        data: row,
      });
    }

    // Check for duplicate phone number
    const existingLeadByPhone = await Lead.findOne({
      primaryNumber: row.CONTACT_NO,
    });
    if (existingLeadByPhone) {
      errors.push({
        row: rowIndex,
        error: 'Contact number already exists in the system',
        field: 'CONTACT_NO',
        data: row,
        existingLeadId: existingLeadByPhone._id.toString(),
      });
    }

    // Validate agent exists
    const agent = await AgentModel.findOne({ agentCode: row.AGENT_ID });
    if (!agent) {
      errors.push({
        row: rowIndex,
        error: 'Agent not found',
        field: 'AGENT_ID',
        data: row,
      });
    }

    return errors;
  }

  private async createLeadFromRow(row: LeadExcelRow, projectId: string) {
    // Find agent
    const agent = await AgentModel.findOne({ agentCode: row.AGENT_ID });
    if (!agent) {
      throw new BadRequestException(
        `Agent not found with code ${row.AGENT_ID}`,
      );
    }

    // Create lead data
    const leadData: Partial<ILead> = {
      firstName: row.FIRST_NAME,
      lastName: row.LAST_NAME,
      emailAddress: row.EMAIL,
      primaryNumber: row.CONTACT_NO,
      leadType: row.LEAD_TYPE,
      stage: row.LEAD_STAGE,
      province: row.Province,
      city: row.CITY,
      leadProgress: 'New Lead Entry',
      allocatorsRemark: row.REMARKS,
      allocatedTo: agent._id as unknown as Types.ObjectId,
      allocatedBy: agent._id as unknown as Types.ObjectId,
      createdBy: agent._id as unknown as Types.ObjectId,
      projectId: new Types.ObjectId(projectId),
      source: 'excel', // Set source as excel for bulk uploads
    };

    // Set the current status and initialize history
    const status = determineLeadStatus('New Lead Entry');
    leadData.currentLeadStatus = status;
    leadData.leadStatusHistory = [status];

    // Create lead using lead service
    return await leadService.createLead(leadData);
  }
}
