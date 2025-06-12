import type { Request, Response } from 'express';
import type {
  ProvinceResponseDto,
  CitiesByProvinceResponseDto,
} from '../dto/province-response.dto';

export interface IProvinceService {
  getAllProvinces(): Promise<ProvinceResponseDto[]>;
  getCitiesByProvinceId(
    provinceId: string,
  ): Promise<CitiesByProvinceResponseDto>;
}

export interface IProvinceController {
  getAllProvinces(req: Request, res: Response): Promise<void>;
  getCitiesByProvinceId(req: Request, res: Response): Promise<void>;
}
