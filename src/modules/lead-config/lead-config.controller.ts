import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { leadConfigService } from './lead-config.service';
import { BaseController } from '@/controllers/base.controller';

interface IFieldConditions {
  visible: boolean;
  required: boolean;
}

interface IFieldConditionsResponse {
  appointmentDate: IFieldConditions;
  startTime: IFieldConditions;
  leadSubDisposition: IFieldConditions;
  leadStatus: IFieldConditions;
}

class LeadConfigController extends BaseController {
  /**
   * Create a new lead configuration
   */
  public createLeadConfiguration = async (req: Request, res: Response) => {
    try {
      const { productId } = req.body;
      console.log(productId);

      if (!Types.ObjectId.isValid(productId)) {
        return this.sendBadRequest(res, 'Invalid product ID');
      }

      const existingConfig = await leadConfigService.getLeadConfiguration(productId);
      if (existingConfig) {
          return this.sendConflict(res, 'Lead configuration already exists for this product');
      }

      const config = await leadConfigService.createLeadConfiguration(req.body);
      return this.sendCreated(res, config);
    } catch (error) {
      return this.sendError(res, 'Failed to create lead configuration', undefined, error as Error);
    }
  };

  /**
   * Update an existing lead configuration
   */
  public updateLeadConfiguration = async (req: Request<{ productId: string }>, res: Response) => {
    try {
      const { productId } = req.params;

      if (!Types.ObjectId.isValid(productId)) {
        return this.sendBadRequest(res, 'Invalid product ID');
      }

      const existingConfig = await leadConfigService.getLeadConfiguration(productId);
      if (!existingConfig) {
        return this.sendNotFound(res, 'Lead configuration not found for this product');
      }

      const config = await leadConfigService.updateLeadConfiguration(productId, req.body);
      return this.sendSuccess(res, config, 'Lead configuration updated successfully');
    } catch (error) {
      return this.sendError(res, 'Failed to update lead configuration', undefined, error as Error);
    }
  };

  /**
   * Get lead configuration for a specific product
   */
  public getLeadConfiguration = async (req: Request<{ productId: string }>, res: Response) => {
    try {
      const { productId } = req.params;

      if (!Types.ObjectId.isValid(productId)) {
        return this.sendBadRequest(res, 'Invalid product ID');
      }

      const config = await leadConfigService.getLeadConfiguration(productId);
      if (!config) {
        return this.sendNotFound(res, 'Lead configuration not found for this product');
      }

      const response = {
        leadProgress: config.leadProgress.filter(p => p.enabled).map(p => ({
          id: p.id,
          name: p.name
        })),
        leadDisposition: config.leadDisposition.filter(d => d.enabled).map(d => ({
          id: d.id,
          name: d.name,
          progressId: d.progressId
        })),
        leadSubDisposition: config.leadSubDisposition.filter(sd => sd.enabled).map(sd => ({
          id: sd.id,
          name: sd.name,
          dispositionId: sd.dispositionId
        }))
      };

      return this.sendSuccess(res, response);
    } catch (error) {
      return this.sendError(res, 'Failed to fetch lead configuration', undefined, error as Error);
    }
  };

  /**
   * Get dispositions for a specific progress ID
   */
  public getDispositions = async (
    req: Request<{ productId: string; progressId: string }>,
    res: Response
  ) => {
    try {
      const { productId, progressId } = req.params;

      if (!Types.ObjectId.isValid(productId)) {
        return this.sendBadRequest(res, 'Invalid product ID');
      }

      const dispositions = await leadConfigService.getDispositions(productId, progressId);
      if (!dispositions) {
        return this.sendNotFound(res, 'Lead configuration not found for this product');
      }

      return this.sendSuccess(res, dispositions);
    } catch (error) {
      return this.sendError(res, 'Failed to fetch dispositions', undefined, error as Error);
    }
  };

  /**
   * Get sub-dispositions for a specific disposition ID
   */
  public getSubDispositions = async (
    req: Request<{ productId: string; dispositionId: string }>,
    res: Response
  ) => {
    try {
      const { productId, dispositionId } = req.params;

      if (!Types.ObjectId.isValid(productId)) {
        return this.sendBadRequest(res, 'Invalid product ID');
      }

      const subDispositions = await leadConfigService.getSubDispositions(productId, dispositionId);
      if (!subDispositions) {
        return this.sendNotFound(res, 'Lead configuration not found for this product');
      }

      return this.sendSuccess(res, subDispositions);
    } catch (error) {
      return this.sendError(res, 'Failed to fetch sub-dispositions', undefined, error as Error);
    }
  };

  /**
   * Get field conditions for the current context
   */
  public getFieldConditions = async (
    req: Request<
      { productId: string },
      any,
      any,
      { progressId?: string; dispositionId?: string; subDispositionId?: string }
    >,
    res: Response
  ) => {
    try {
      const { productId } = req.params;
      const { progressId, dispositionId, subDispositionId } = req.query;

      if (!Types.ObjectId.isValid(productId)) {
        return this.sendBadRequest(res, 'Invalid product ID');
      }

      const fieldConditions = await leadConfigService.getFieldConditions(
        productId,
        progressId as string,
        dispositionId as string,
        subDispositionId as string
      );

      if (!fieldConditions) {
        return this.sendNotFound(res, 'Lead configuration not found for this product');
      }

      return this.sendSuccess(res, fieldConditions);
    } catch (error) {
      return this.sendError(res, 'Failed to fetch field conditions', undefined, error as Error);
    }
  };
}

export const leadConfigController = new LeadConfigController(); 