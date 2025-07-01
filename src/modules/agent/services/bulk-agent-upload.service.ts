import { read as readXlsx, utils as xlsxUtils } from 'xlsx';
import type { AgentRepository } from '../agent.repository';
import type { ChannelRepository } from '@/modules/channel/channel.repository';
import type { DesignationRepository } from '@/modules/designation/designation.repository';
import type { UserRepository } from '@/modules/user/user.repository';
import type { ProjectRepository } from '@/modules/project/project.repository';
import { BadRequestException } from '@/common/exceptions/bad-request.exception';
import { Types } from 'mongoose';
import { generateAgentCode } from '../utils/agent-code-generator';
import { getUserIdByProjectId } from '../utils/user-project.util';

interface ExcelRow {
  'Agent First Name': string;
  'Agent Last Name': string;
  Email: string;
  'Mobile Number': string;
  Channel: string;
  Designation: string;
  'Agent Code'?: string;
  Branch?: string;
  'Appointment Date'?: string;
  'CA Number'?: string;
  Province?: string;
  City?: string;
  'Pin Code'?: string;
  Status?: string;
  'Reporting Manager ID'?: string;
  TIN?: string;
  [key: string]: string | undefined;
}

interface ValidationError {
  row: number;
  error: string;
  field: string;
  data: ExcelRow;
}

interface ProcessResult {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  batchSize: number;
  errors: ValidationError[];
  createdAgents: Array<{
    agentCode: string;
    email: string;
    name: string;
    userId: string;
    status: string;
  }>;
}

export class BulkAgentUploadService {
  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly channelRepository: ChannelRepository,
    private readonly designationRepository: DesignationRepository,
    private readonly userRepository: UserRepository,
    private readonly projectRepository: ProjectRepository,
  ) {}

  async processExcelFile(
    fileBuffer: Buffer,
    projectId: string,
    batchSize = 100,
  ): Promise<ProcessResult> {
    const workbook = readXlsx(fileBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsxUtils.sheet_to_json<ExcelRow>(worksheet);

    const result: ProcessResult = {
      totalProcessed: rows.length,
      successCount: 0,
      failureCount: 0,
      batchSize,
      errors: [],
      createdAgents: [],
    };

    // Validate project exists
    const project = await this.projectRepository.findById(projectId);
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
    batch: ExcelRow[],
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

        const agent = await this.createAgentFromRow(row, projectId);
        result.createdAgents.push({
          agentCode: agent.agentCode,
          email: agent.email ?? '',
          name: `${agent.firstName} ${agent.lastName}`,
          userId:
            typeof agent.userId === 'string'
              ? agent.userId
              : agent.userId &&
                  typeof agent.userId === 'object' &&
                  '_id' in agent.userId
                ? agent.userId._id.toString()
                : '',
          status: agent.agentStatus,
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
    row: ExcelRow,
    rowIndex: number,
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Required fields validation
    const requiredFields = [
      'Agent First Name',
      'Agent Last Name',
      'Email',
      'Mobile Number',
      'Channel',
      'Designation',
    ];

    for (const field of requiredFields) {
      if (!row[field]) {
        errors.push({
          row: rowIndex,
          error: `${field} is required`,
          field,
          data: row,
        });
      }
    }

    if (errors.length > 0) return errors;

    // Email format and uniqueness validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.Email)) {
      errors.push({
        row: rowIndex,
        error: 'Invalid email format',
        field: 'Email',
        data: row,
      });
    } else {
      // Check if email already exists
      const existingAgent = await this.agentRepository.findOne({
        email: row.Email,
      });
      if (existingAgent) {
        errors.push({
          row: rowIndex,
          error: 'Email already exists',
          field: 'Email',
          data: row,
        });
      }
    }

    // Phone number format and uniqueness validation
    const mobileNumber = row['Mobile Number'].toString();
    const phoneRegex = /^[09]\d{10}$/; // 11 digits starting with 0 or 9
    if (!phoneRegex.test(mobileNumber)) {
      errors.push({
        row: rowIndex,
        error: 'Mobile number must be 11 digits and start with 0 or 9',
        field: 'Mobile Number',
        data: row,
      });
    } else {
      // Check if mobile number already exists
      const existingAgent = await this.agentRepository.findOne({
        phoneNumber: mobileNumber,
      });
      if (existingAgent) {
        errors.push({
          row: rowIndex,
          error: 'Mobile number already exists',
          field: 'Mobile Number',
          data: row,
        });
      }
    }

    // Check agent code uniqueness if provided
    if (row['Agent Code']) {
      const existingAgent = await this.agentRepository.findOne({
        agentCode: row['Agent Code'],
      });
      if (existingAgent) {
        errors.push({
          row: rowIndex,
          error: 'Agent code already exists',
          field: 'Agent Code',
          data: row,
        });
      }
    }

    // Validate channel
    const channel = await this.channelRepository.findOne({
      $or: [{ channelName: row.Channel }, { channelCode: row.Channel }],
    });
    if (!channel) {
      errors.push({
        row: rowIndex,
        error: 'Invalid channel',
        field: 'Channel',
        data: row,
      });
      return errors; // Return early as we need channel for further validation
    }

    // Validate designation
    const designation = await this.designationRepository.findOne({
      $or: [
        { designationName: row.Designation },
        { designationCode: row.Designation },
      ],
    });
    if (!designation) {
      errors.push({
        row: rowIndex,
        error: 'Invalid designation',
        field: 'Designation',
        data: row,
      });
      return errors; // Return early as we need designation for further validation
    }

    // Validate channel-designation mapping
    const designationWithChannel = await this.designationRepository.findOne({
      _id: designation._id,
      channelId: channel._id,
    });
    if (!designationWithChannel) {
      errors.push({
        row: rowIndex,
        error: `Designation '${row.Designation}' is not mapped to channel '${row.Channel}'`,
        field: 'Designation',
        data: row,
      });
      return errors;
    }

    // Validate reporting manager if provided
    if (row['Reporting Manager ID']) {
      const reportingManager = await this.agentRepository.findOne({
        agentCode: row['Reporting Manager ID'],
      });
      if (!reportingManager) {
        errors.push({
          row: rowIndex,
          error: 'Invalid reporting manager',
          field: 'Reporting Manager ID',
          data: row,
        });
      }
    }

    // Validate status if provided
    if (
      row.Status &&
      !['active', 'inactive', 'suspended'].includes(row.Status.toLowerCase())
    ) {
      errors.push({
        row: rowIndex,
        error: 'Invalid status. Must be one of: active, inactive, suspended',
        field: 'Status',
        data: row,
      });
    }

    return errors;
  }

  private async createAgentFromRow(row: ExcelRow, projectId: string) {
    // Find channel and designation IDs
    const channel = await this.channelRepository.findOne({
      $or: [{ channelName: row.Channel }, { channelCode: row.Channel }],
    });

    const designation = await this.designationRepository.findOne({
      $or: [
        { designationName: row.Designation },
        { designationCode: row.Designation },
      ],
    });

    if (!channel || !designation) {
      throw new BadRequestException('Channel or designation not found');
    }

    // Find reporting manager if provided
    let reportingManagerId;
    if (row['Reporting Manager ID']) {
      const reportingManager = await this.agentRepository.findOne({
        agentCode: row['Reporting Manager ID'],
      });
      reportingManagerId = reportingManager?._id;
    }

    // Generate agent code if not provided
    const agentCode = row['Agent Code'] ?? (await generateAgentCode(projectId));

    // Get user ID for the project
    const userId = await getUserIdByProjectId(projectId);

    // Convert Excel date number to JavaScript Date
    let joiningDate = new Date();
    if (row['Appointment Date']) {
      const excelDate = Number(row['Appointment Date']);
      if (!isNaN(excelDate)) {
        // Excel dates are number of days since 1900-01-01
        // Subtract 2 to account for Excel's date system quirks
        const daysSince1900 = excelDate - 2;
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        joiningDate = new Date(
          Date.UTC(1900, 0, 1) + daysSince1900 * millisecondsPerDay,
        );
      }
    }

    return this.agentRepository.create({
      userId,
      channelId: channel._id as unknown as Types.ObjectId,
      designationId: designation._id as unknown as Types.ObjectId,
      projectId: new Types.ObjectId(projectId),
      agentCode,
      employeeId: row['CA Number'],
      firstName: row['Agent First Name'],
      lastName: row['Agent Last Name'],
      email: row.Email,
      phoneNumber: row['Mobile Number'].toString(),
      agentStatus:
        (row.Status?.toLowerCase() as 'active' | 'inactive' | 'suspended') ||
        'active',
      joiningDate,
      reportingManagerId: reportingManagerId as unknown as
        | Types.ObjectId
        | undefined,
    });
  }
}
