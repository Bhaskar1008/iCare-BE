import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { BaseController } from '@/controllers/base.controller';
import { LeadHistoryModel } from '@/models/lead-history.model';
import logger from '@/common/utils/logger';

class LeadHistoryController extends BaseController {
  /**
   * Get history for a specific lead
   */
  public getLeadHistory = async (req: Request, res: Response) => {
    try {
      const { leadId } = req.params;
      const { page = 1, limit = 10, changeType } = req.query;

      if (!Types.ObjectId.isValid(leadId)) {
        return this.sendBadRequest(res, 'Invalid lead ID');
      }

      const query: any = {
        leadId: new Types.ObjectId(leadId),
        isDeleted: false
      };

      if (changeType) {
        query.changeType = changeType;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [history, total] = await Promise.all([
        LeadHistoryModel.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(Number(limit))
          .populate('changedBy', 'firstName lastName email'),
        LeadHistoryModel.countDocuments(query)
      ]);

      return this.sendSuccess(res, {
        history,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Error fetching lead history:', error);
      return this.sendError(res, 'Failed to fetch lead history');
    }
  };

  /**
   * Get history by ID
   */
  public getHistoryById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        return this.sendBadRequest(res, 'Invalid history ID');
      }

      const history = await LeadHistoryModel.findById(id)
        .populate('changedBy', 'firstName lastName email');

      if (!history) {
        return this.sendNotFound(res, 'History record not found');
      }

      return this.sendSuccess(res, history);
    } catch (error) {
      logger.error('Error fetching history by ID:', error);
      return this.sendError(res, 'Failed to fetch history record');
    }
  };

  /**
   * Get history summary for a lead
   */
  public getLeadHistorySummary = async (req: Request, res: Response) => {
    try {
      const { leadId } = req.params;

      if (!Types.ObjectId.isValid(leadId)) {
        return this.sendBadRequest(res, 'Invalid lead ID');
      }

      const summary = await LeadHistoryModel.aggregate([
        {
          $match: {
            leadId: new Types.ObjectId(leadId),
            isDeleted: false
          }
        },
        {
          $group: {
            _id: '$changeType',
            count: { $sum: 1 },
            lastChange: { $max: '$timestamp' }
          }
        }
      ]);

      return this.sendSuccess(res, summary);
    } catch (error) {
      logger.error('Error fetching lead history summary:', error);
      return this.sendError(res, 'Failed to fetch history summary');
    }
  };
}

export const leadHistoryController = new LeadHistoryController();