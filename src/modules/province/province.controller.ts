import type { Request, Response } from 'express';
import { BaseController } from '@/controllers/base.controller';
import { ProvinceService } from './province.service';
import type {
  IProvinceController,
  IProvinceService,
} from './interfaces/province.interface';
import { DatabaseOperationException } from '@/common/exceptions/database.exception';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import logger from '@/common/utils/logger';

export class ProvinceController
  extends BaseController
  implements IProvinceController
{
  private provinceService: IProvinceService;

  constructor() {
    super();
    this.provinceService = new ProvinceService();
  }

  public getAllProvinces = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Get all provinces request received');

      const provinces = await this.provinceService.getAllProvinces();

      logger.debug('Provinces retrieved successfully', {
        count: provinces.length,
      });

      this.sendSuccess(res, provinces, 'Provinces retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get provinces:', {
        error: err.message,
        stack: err.stack,
      });

      this.sendError(
        res,
        'Failed to retrieve provinces',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getCitiesByProvinceId = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { provinceId } = req.params;
      logger.debug('Get cities by province ID request received', {
        provinceId,
      });

      if (!provinceId) {
        this.sendBadRequest(res, 'Province ID is required');
        return;
      }

      const result =
        await this.provinceService.getCitiesByProvinceId(provinceId);

      logger.debug('Cities retrieved successfully', {
        provinceId,
        count: result.cities.length,
      });

      this.sendSuccess(res, result, 'Cities retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get cities:', {
        error: err.message,
        stack: err.stack,
        provinceId: req.params.provinceId,
      });

      if (error instanceof DatabaseOperationException) {
        this.sendNotFound(res, err.message);
        return;
      }

      this.sendError(
        res,
        'Failed to retrieve cities',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };
}
