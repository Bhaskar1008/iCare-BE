import type { Request, Response } from 'express';
import { utils as xlsxUtils, write as writeXlsx } from 'xlsx';
import { BusinessCommitmentService } from './business-commitment.service';
import { CreateBusinessCommitmentDto } from './dto/create-business-commitment.dto';
import { UpdateBusinessCommitmentDto } from './dto/update-business-commitment.dto';
import { UpdateCommitmentCountDto } from './dto/update-commitment-count.dto';
import { FilterBusinessCommitmentDto } from './dto/filter-business-commitment.dto';
import { validateOrReject } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';

export class BusinessCommitmentController {
  private readonly businessCommitmentService: BusinessCommitmentService;

  constructor() {
    this.businessCommitmentService = new BusinessCommitmentService();
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const createDto = plainToClass(CreateBusinessCommitmentDto, {
        ...req.body,
        createdBy: req.body.agentId, // Set createdBy to agentId
      });
      await validateOrReject(createDto);

      const result = await this.businessCommitmentService.create(createDto);

      if (result.existingCommitment) {
        res.status(409).json({
          message: 'A commitment already exists for this date',
          existingCommitment: result.existingCommitment,
        });
        return;
      }

      res.status(201).json(result.commitment);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      res.status(400).json({ message });
    }
  }

  async updateCommitmentCount(req: Request, res: Response): Promise<void> {
    try {
      const updateDto = plainToClass(UpdateCommitmentCountDto, req.body);
      await validateOrReject(updateDto);

      const result = await this.businessCommitmentService.updateCommitmentCount(
        req.params.id,
        updateDto.additionalCount,
      );
      res.status(200).json(result);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      res.status(400).json({ message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const updateDto = plainToClass(UpdateBusinessCommitmentDto, req.body);
      await validateOrReject(updateDto);

      const result = await this.businessCommitmentService.update(
        req.params.id,
        updateDto,
      );
      res.status(200).json(result);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      res.status(400).json({ message });
    }
  }

  async filter(req: Request, res: Response): Promise<void> {
    try {
      const filterDto = plainToClass(FilterBusinessCommitmentDto, req.query);
      await validateOrReject(filterDto);

      const result = await this.businessCommitmentService.filter(filterDto);
      res.status(200).json(result);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      res.status(400).json({ message });
    }
  }

  public async exportToExcel(req: Request, res: Response): Promise<void> {
    try {
      // Transform and validate query parameters
      const filterDto = plainToClass(FilterBusinessCommitmentDto, {
        agentId: req.query.agentId,
        fromDate: req.query.fromDate
          ? new Date(req.query.fromDate as string)
          : undefined,
        toDate: req.query.toDate
          ? new Date(req.query.toDate as string)
          : undefined,
      });

      try {
        await validateOrReject(filterDto);
      } catch (errors) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD format.',
          errors,
        });
        return;
      }

      // Get commitments using existing service method
      const commitments =
        await this.businessCommitmentService.filter(filterDto);

      // Transform data for Excel
      const excelData = commitments.map(commitment => {
        const agent = commitment.agentId as any;

        return {
          // 'Debug Info': JSON.stringify({
          //   index,
          //   hasAgentId: !!commitment.agentId,
          //   rawAgentId: commitment.agentId,
          //   agentFields: agent ? Object.keys(agent) : [],
          //   agentCode: agent?.agentCode,
          //   firstName: agent?.firstName,
          //   lastName: agent?.lastName,
          //   designationId: agent?.designationId
          // }, null, 2),
          'Agent Code': agent?.agentCode ?? 'N/A',
          'Agent Name': agent
            ? (`${agent.firstName ?? ''} ${agent.lastName ?? ''}`.trim() ??
              'N/A')
            : 'N/A',
          Designation: agent?.designationId?.designationName ?? 'N/A',
          'Commitment Date': commitment.commitmentDate
            .toISOString()
            .split('T')[0],
          'Commitment Count': commitment.commitmentCount ?? 0,
          'Achieved Count': commitment.achievedCount ?? 0,
          'Achievement %': `${commitment.achievementPercentage ?? 0}%`,
          'Created At': commitment.createdAt
            .toISOString()
            .replace('T', ' ')
            .split('.')[0],
        };
      });

      // Create worksheet with headers
      const worksheet = xlsxUtils.json_to_sheet(excelData, {
        header: [
          // 'Debug Info',
          'Agent Code',
          'Agent Name',
          'Designation',
          'Commitment Date',
          'Commitment Count',
          'Achieved Count',
          'Achievement %',
          'Created At',
        ],
      });

      // Set column widths
      const columnWidths = [
        // { wch: 100 }, // Debug Info
        { wch: 15 }, // Agent Code
        { wch: 25 }, // Agent Name
        { wch: 25 }, // Designation
        { wch: 15 }, // Commitment Date
        { wch: 15 }, // Commitment Count
        { wch: 15 }, // Achieved Count
        { wch: 15 }, // Achievement %
        { wch: 20 }, // Created At
      ];
      worksheet['!cols'] = columnWidths;

      // Create workbook
      const workbook = {
        Sheets: { 'Business Commitments': worksheet },
        SheetNames: ['Business Commitments'],
      };

      // Generate Excel buffer
      const excelBuffer = writeXlsx(workbook, { type: 'buffer' });

      // Set response headers
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=business-commitments.xlsx',
      );

      // Send file
      res.send(excelBuffer);
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to generate Excel file',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
