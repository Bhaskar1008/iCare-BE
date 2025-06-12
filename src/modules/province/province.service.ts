import { ProvinceModel } from '@/models/province.model';
import type { IProvinceService } from './interfaces/province.interface';
import type {
  ProvinceResponseDto,
  CitiesByProvinceResponseDto,
} from './dto/province-response.dto';
import { DatabaseOperationException } from '@/common/exceptions/database.exception';
import logger from '@/common/utils/logger';

export class ProvinceService implements IProvinceService {
  public async getAllProvinces(): Promise<ProvinceResponseDto[]> {
    try {
      logger.debug('Getting all provinces');

      const provinces = await ProvinceModel.find(
        {},
        { cities: 0 }, // Exclude cities array from the response
      ).sort({ name: 1 });

      logger.debug('Provinces retrieved successfully', {
        count: provinces.length,
      });

      return provinces.map(province => ({
        _id: province._id.toString(),
        name: province.name,
        createdAt: province.createdAt,
        updatedAt: province.updatedAt,
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get provinces:', {
        error: err.message,
        stack: err.stack,
      });
      throw new DatabaseOperationException('Failed to retrieve provinces');
    }
  }

  public async getCitiesByProvinceId(
    provinceId: string,
  ): Promise<CitiesByProvinceResponseDto> {
    try {
      logger.debug('Getting cities by province ID', { provinceId });

      const province = await ProvinceModel.findById(provinceId);

      if (!province) {
        throw new DatabaseOperationException('Province not found');
      }

      logger.debug('Cities retrieved successfully', {
        provinceId,
        count: province.cities.length,
      });

      return {
        cities: province.cities.map(city => ({
          _id: city._id.toString(),
          name: city.name,
          isCapital: city.isCapital,
        })),
        provinceName: province.name,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get cities by province ID:', {
        error: err.message,
        stack: err.stack,
        provinceId,
      });
      throw new DatabaseOperationException('Failed to retrieve cities');
    }
  }
}
