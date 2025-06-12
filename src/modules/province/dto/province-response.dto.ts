import type { ICity } from '@/models/province.model';

export interface ProvinceResponseDto {
  _id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CityResponseDto extends ICity {
  _id: string;
  name: string;
  isCapital: boolean;
}

export interface CitiesByProvinceResponseDto {
  cities: CityResponseDto[];
  provinceName: string;
}
