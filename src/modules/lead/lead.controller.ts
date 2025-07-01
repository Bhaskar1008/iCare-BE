import type { Request, Response } from 'express';
import { BaseController } from '@/controllers/base.controller';
import { leadService } from './lead.service';
import type { ILead } from '@/models/lead.model';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import { BadRequestException } from '@/common/exceptions/bad-request.exception';
import { Types } from 'mongoose';
import { NotFoundException } from '@/common/exceptions/not-found.exception';
import type { ValidatedRequest } from '@/common/interfaces/validation.interface';
import type { LeadCreatorQueryDto } from './dto/lead-query.dto';
import { BulkLeadUploadService } from './services/bulk-lead-upload.service';
import { leadNotificationService } from '../notification/services/lead-notification.service';

type LeadFilter =
  | 'today'
  | 'all'
  | 'Open'
  | 'Converted'
  | 'Discarded'
  | 'Failed';

interface AdvancedFilterCriteria {
  sortBy?:
    | 'Lead Created date - Newest to oldest'
    | 'Lead Created date - oldest to Newest';
  searchType?: 'Name' | 'Mobile' | 'Lead ID';
  name?: string;
  mobileNo?: string;
  leadId?: string;
  leadStatus?: string;
  leadType?: string;
  leadProgress?: string;
  leadDisposition?: string;
  leadSubDisposition?: string;
  createdBy: string;
}

interface CreateLeadRequest {
  firstName: string;
  lastName: string;
  emailAddress: string;
  primaryNumber: string;
  leadType: string;
  stage: string;
  leadProgress: string;
  allocatedTo: string;
  allocatedBy: string;
  createdBy: string;
  projectId?: string;
  moduleId?: string;
  [key: string]: unknown;
}

class LeadController extends BaseController {
  private bulkLeadUploadService: BulkLeadUploadService;

  constructor() {
    super();
    this.bulkLeadUploadService = new BulkLeadUploadService();
  }

  public createLead = async (
    req: Request<unknown, unknown, CreateLeadRequest>,
    res: Response,
  ): Promise<void> => {
    try {
      // Validate required fields for initial creation
      const requiredFields = [
        'firstName',
        'lastName',
        'emailAddress',
        'primaryNumber',
        'leadType',
        'stage',
        'leadProgress',
        'allocatedTo',
        'allocatedBy',
        'createdBy',
      ];

      const missingFields = requiredFields.filter(field => !req.body[field]);
      if (missingFields.length > 0) {
        throw new BadRequestException(
          `Missing required fields: ${missingFields.join(', ')}`,
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.emailAddress)) {
        throw new BadRequestException('Invalid email address format');
      }

      const existingLead = await leadService.verifyLead(
        req.body.emailAddress,
        req.body.primaryNumber,
      );
      if (existingLead) {
        throw new BadRequestException('Lead already exists');
      }

      // Convert string IDs to ObjectIds
      const { projectId, moduleId, ...restBody } = req.body;
      const leadData: Partial<ILead> = {
        ...restBody,
        allocatedTo: new Types.ObjectId(req.body.allocatedTo),
        allocatedBy: new Types.ObjectId(req.body.allocatedBy),
        createdBy: new Types.ObjectId(req.body.createdBy),
        ...(projectId && { projectId: new Types.ObjectId(projectId) }),
        ...(moduleId && { moduleId: new Types.ObjectId(moduleId) }),
      };

      // Create lead
      const lead = await leadService.createLead(leadData);

      await leadNotificationService.notifyLeadCreation(lead);

      this.sendCreated(res, {
        message: 'Lead created successfully. Please update additional details.',
        data: lead,
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        this.sendBadRequest(res, error.message);
        return;
      }
      this.handleError(error as Error, res);
    }
  };

  public getLead = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const id = String(req.params.id);
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid lead ID format');
      }

      const lead = await leadService.getLead(id);
      this.sendSuccess(res, lead);
    } catch (error) {
      this.handleError(error as Error, res);
    }
  };

  public updateLead = async (
    req: Request<{ id: string }, unknown, Partial<ILead>>,
    res: Response,
  ): Promise<void> => {
    try {
      const id = String(req.params.id);
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid lead ID format');
      }

      const updateData: Partial<ILead> = { ...req.body };

      const objectIdFields = [
        'allocatedTo',
        'allocatedBy',
        'createdBy',
        'projectId',
        'moduleId',
      ] as const;
      type ObjectIdField = (typeof objectIdFields)[number];

      objectIdFields.forEach((field: ObjectIdField) => {
        const value = req.body[field];
        if (value && typeof value === 'string') {
          if (!Types.ObjectId.isValid(value)) {
            throw new BadRequestException(`Invalid ${field} ID format`);
          }
          updateData[field] = new Types.ObjectId(value);
        }
      });

      const lead = await leadService.updateLead(id, updateData);

      if (objectIdFields.includes('allocatedTo')) {
        await leadNotificationService.notifyLeadAllocation(lead);
      }

      this.sendSuccess(res, lead);
    } catch (error) {
      this.handleError(error as Error, res);
    }
  };

  public getStatusCount = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const id = String(req.params.id);
      const statusCount = await leadService.getStatusCount(id);
      this.sendSuccess(res, statusCount);
    } catch (error) {
      this.handleError(error as Error, res);
    }
  };

  public getLeadStatusCounts = async (
    req: Request<{ userId: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const userId = String(req.params.userId);
      const counts = await leadService.getLeadStatusCounts(userId);
      this.sendSuccess(res, counts);
    } catch (error) {
      this.handleError(error as Error, res);
    }
  };

  public getFilteredLeads = async (
    req: Request<
      unknown,
      unknown,
      unknown,
      {
        filter: LeadFilter;
        page?: string;
        limit?: string;
        createdBy: string;
      }
    >,
    res: Response,
  ): Promise<void> => {
    try {
      const { filter, page = '1', limit = '10', createdBy } = req.query;

      // Validate filter
      const validFilters: LeadFilter[] = [
        'today',
        'all',
        'Open',
        'Converted',
        'Discarded',
        'Failed',
      ];
      if (!validFilters.includes(filter)) {
        throw new BadRequestException(
          'Invalid filter. Must be one of: today, all, Open, Converted, Discarded, Failed',
        );
      }

      const leads = await leadService.getFilteredLeads(
        filter,
        parseInt(page, 10),
        parseInt(limit, 10),
        createdBy,
      );

      this.sendSuccess(res, leads);
    } catch (error) {
      this.handleError(error as Error, res);
    }
  };

  public changeLeadOwnership = async (
    req: Request<
      { id: string },
      unknown,
      { allocatedTo: string; allocatedBy: string }
    >,
    res: Response,
  ): Promise<void> => {
    try {
      const id = String(req.params.id);
      const { allocatedTo, allocatedBy } = req.body;

      if (!allocatedTo || !allocatedBy) {
        throw new BadRequestException(
          'Both allocatedTo and allocatedBy are required',
        );
      }

      const lead = await leadService.changeLeadOwnership(
        id,
        new Types.ObjectId(allocatedTo),
        new Types.ObjectId(allocatedBy),
      );

      await leadNotificationService.notifyLeadAllocation(lead);
      this.sendSuccess(res, lead);
    } catch (error) {
      this.handleError(error as Error, res);
    }
  };

  public getLeadHistory = async (
    req: Request<
      { id: string },
      unknown,
      unknown,
      { page?: string; limit?: string }
    >,
    res: Response,
  ): Promise<void> => {
    try {
      const id = String(req.params.id);
      const { page = '1', limit = '10' } = req.query;

      const history = await leadService.getLeadHistory(
        id,
        parseInt(page, 10),
        parseInt(limit, 10),
      );

      this.sendSuccess(res, history);
    } catch (error) {
      this.handleError(error as Error, res);
    }
  };

  public advancedFilter = async (
    req: Request<
      unknown,
      unknown,
      AdvancedFilterCriteria,
      { page?: string; limit?: string }
    >,
    res: Response,
  ): Promise<void> => {
    try {
      const {
        page = '1',
        limit = '10',
        sortBy,
        createdBy,
        searchType,
        name,
        mobileNo,
        leadId,
        leadStatus,
        leadType,
        leadProgress,
        leadDisposition,
        leadSubDisposition,
      } = req.query as Partial<{
        page: string;
        limit: string;
        sortBy: string;
        createdBy: string;
        searchType: string;
        name: string;
        mobileNo: string;
        leadId: string;
        leadStatus: string;
        leadType: string;
        leadProgress: string;
        leadDisposition: string;
        leadSubDisposition: string;
      }>;

      const filterCriteria: AdvancedFilterCriteria = {
        createdBy: createdBy ?? '',
      };
      if (sortBy)
        filterCriteria.sortBy =
          (sortBy as
            | 'Lead Created date - Newest to oldest'
            | 'Lead Created date - oldest to Newest') ||
          'Lead Created date - Newest to oldest';
      if (createdBy) filterCriteria.createdBy = createdBy;
      if (searchType)
        filterCriteria.searchType =
          (searchType as 'Name' | 'Mobile' | 'Lead ID') || 'Name';
      if (name) filterCriteria.name = name;
      if (mobileNo) filterCriteria.mobileNo = mobileNo;
      if (leadId) filterCriteria.leadId = leadId;
      if (leadStatus) filterCriteria.leadStatus = leadStatus;
      if (leadType) filterCriteria.leadType = leadType;
      if (leadProgress) filterCriteria.leadProgress = leadProgress;
      if (leadDisposition) filterCriteria.leadDisposition = leadDisposition;
      if (leadSubDisposition)
        filterCriteria.leadSubDisposition = leadSubDisposition;

      // Validate createdBy (mandatory field)
      if (
        !filterCriteria.createdBy ||
        !Types.ObjectId.isValid(filterCriteria.createdBy)
      ) {
        throw new BadRequestException('Invalid or missing createdBy field');
      }

      // Validate name field if searchType is Name
      if (filterCriteria.searchType === 'Name' && !filterCriteria.name) {
        throw new BadRequestException(
          'Name is required when searchType is Name',
        );
      }
      const leads = await leadService.getAdvancedFilteredLeads(
        filterCriteria,
        parseInt(page, 10),
        parseInt(limit, 10),
      );

      this.sendSuccess(res, leads);
    } catch (error) {
      this.handleError(error as Error, res);
    }
  };

  public getLeadsByCreator = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { createdBy } = req.params;
      const queryParams = (req as ValidatedRequest<LeadCreatorQueryDto>)
        .validatedQuery;

      const page = parseInt(queryParams.page ?? '1', 10);
      const limit = parseInt(queryParams.limit ?? '10', 10);

      if (!createdBy || !Types.ObjectId.isValid(createdBy)) {
        throw new BadRequestException('Invalid creator ID format');
      }

      const leads = await leadService.getLeadsByCreator(createdBy, page, limit);
      this.sendSuccess(res, leads, 'Leads retrieved successfully');
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.sendNotFound(res, error.message);
        return;
      }
      if (error instanceof BadRequestException) {
        this.sendBadRequest(res, error.message);
        return;
      }
      this.handleError(error as Error, res);
    }
  };

  public async bulkUpload(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, batchSize } = req.body;
      const fileBuffer = req.file?.buffer;

      if (!fileBuffer) {
        throw new BadRequestException('No file uploaded');
      }

      const result = await this.bulkLeadUploadService.processExcelFile(
        fileBuffer,
        projectId as string,
        batchSize as number,
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Bulk upload processed successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'An unknown error occurred',
        });
      }
    }
  }

  private handleError(error: Error, res: Response): void {
    this.sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export const leadController = new LeadController();
