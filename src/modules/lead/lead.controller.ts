import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { BaseController } from '@/controllers/base.controller';
import { leadService } from './lead.service';
import { BadRequestException } from '../../common/exceptions/bad-request.exception';
import { MESSAGES } from '@/common/constants/messages.constants';

class LeadController extends BaseController {
  /**
   * Create a new lead
   */
  public createLead = async (req: Request, res: Response) => {
    try {
      const { productId } = req.body;

      if (!Types.ObjectId.isValid(productId)) {
        return this.sendBadRequest(res, MESSAGES.LEAD.CREATE.VALIDATION.INVALID_PRODUCT);
      }

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
        'allocatedBy'
      ];

      const missingFields = this.validateRequiredFields(req.body, requiredFields);
      if (missingFields.length > 0) {
        return this.sendBadRequest(res, MESSAGES.LEAD.CREATE.VALIDATION.MISSING_FIELDS(missingFields));
      }

      // Validate email format
      if (!this.validateEmail(req.body.emailAddress)) {
        return this.sendBadRequest(res, 'Invalid email address format');
      }
      console.log("req.body", req.body);
      const lead = await leadService.createLead(req.body);
      return this.sendCreated(res, lead, MESSAGES.LEAD.CREATE.SUCCESS);
    } catch (error) {
      return this.sendError(res, (error as Error).message || MESSAGES.LEAD.CREATE.FAILURE);
    }
  };

  /**
   * Update an existing lead
   */
  public updateLead = async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        return this.sendBadRequest(res, MESSAGES.COMMON.INVALID_ID);
      }

      const lead = await leadService.updateLead(id, req.body);
      if (!lead) {
        return this.sendNotFound(res, MESSAGES.LEAD.UPDATE.NOT_FOUND);
      }

      return this.sendSuccess(res, lead, MESSAGES.LEAD.UPDATE.SUCCESS);
    } catch (error) {
      return this.sendError(res, (error as Error).message || MESSAGES.LEAD.UPDATE.FAILURE);
    }
  };

  /**
   * Get a lead by ID
   */
  public getLead = async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        return this.sendBadRequest(res, MESSAGES.COMMON.INVALID_ID);
      }

      const lead = await leadService.getLead(id);
      if (!lead) {
        return this.sendNotFound(res, MESSAGES.LEAD.GET.NOT_FOUND);
      }

      return this.sendSuccess(res, lead, MESSAGES.LEAD.GET.SUCCESS);
    } catch (error) {
      return this.sendError(res, (error as Error).message || MESSAGES.LEAD.GET.FAILURE);
    }
  };

  /**
   * Get leads with pagination
   */
  public getLeads = async (req: Request, res: Response) => {
    try {
      const { allocatedTo } = req.params;
      const { page = 1, limit = 10, ...filters } = req.query;

      if (!allocatedTo) {
        return this.sendBadRequest(res, MESSAGES.LEAD.GET.INVALID_QUERY);
      }

      const result = await leadService.getLeads({
        allocatedTo,
        page: Number(page),
        limit: Number(limit),
        ...filters
      });

      return this.sendSuccess(res, result, MESSAGES.LEAD.GET.SUCCESS);
    } catch (error) {
      return this.sendError(res, (error as Error).message || MESSAGES.LEAD.GET.FAILURE);
    }
  };

  /**
   * Delete a lead
   */
  public deleteLead = async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        return this.sendBadRequest(res, 'Invalid lead ID');
      }

      const lead = await leadService.deleteLead(id);
      if (!lead) {
        return this.sendNotFound(res, 'Lead not found');
      }

      return this.sendSuccess(res, lead, 'Lead deleted successfully');
    } catch (error) {
      return this.sendError(res, (error as Error).message);
    }
  };

  /**
   * Change ownership of leads
   */
  public changeOwnership = async (req: Request, res: Response) => {
    try {
      const { leadIds, newOwnerId, changedBy } = req.body;
      // const changedBy = req.user?.id; // Assuming you have user info in request

      if (!Array.isArray(leadIds) || leadIds.length === 0) {
        return this.sendBadRequest(res, MESSAGES.LEAD.OWNERSHIP.VALIDATION.INVALID_LEADS);
      }

      if (!newOwnerId) {
        return this.sendBadRequest(res, MESSAGES.LEAD.OWNERSHIP.VALIDATION.INVALID_OWNER);
      }

      if (!changedBy) {
        return this.sendBadRequest(res, 'User information is missing');
      }

      const result = await leadService.changeOwnership({
        leadIds,
        newOwnerId,
        changedBy,
        remarks: req.body.remarks
      });

      return this.sendSuccess(res, result, MESSAGES.LEAD.OWNERSHIP.SUCCESS);
    } catch (error) {
      return this.sendError(res, (error as Error).message || MESSAGES.LEAD.OWNERSHIP.FAILURE);
    }
  };

  /**
   * Get lead counts by status
   */
  public getLeadStatusCounts = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return this.sendBadRequest(res, MESSAGES.COMMON.INVALID_ID);
      }

      const counts = await leadService.getLeadStatusCounts(userId);
      return this.sendSuccess(res, counts, MESSAGES.LEAD.STATUS.SUCCESS);
    } catch (error) {
      return this.sendError(res, (error as Error).message || MESSAGES.LEAD.STATUS.FAILURE);
    }
  };

  /**
   * Get leads by status
   */
  public getLeadsByStatus = async (req: Request, res: Response) => {
    try {
      const { status, userId } = req.params;
      const { page = 1, limit = 10, sortBy, sortOrder } = req.query;

      if (!userId) {
        return this.sendBadRequest(res, MESSAGES.COMMON.INVALID_ID);
      }

      if (!status) {
        return this.sendBadRequest(res, 'Status parameter is required');
      }

      const result = await leadService.getLeadsByStatus({
        status,
        userId,
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as string,
        sortOrder: (sortOrder as 'asc' | 'desc') || 'desc'
      });

      return this.sendSuccess(res, result, MESSAGES.LEAD.GET.SUCCESS);
    } catch (error) {
      return this.sendError(res, (error as Error).message || MESSAGES.LEAD.GET.FAILURE);
    }
  };
}

export const leadController = new LeadController();
