import type { Request, Response } from 'express';
import type { CreateProductCategoryDto } from '../dto/create-product-category.dto';
import type { UpdateProductCategoryDto } from '../dto/update-product-category.dto';
import type { ProductCategoryResponseDto } from '../dto/product-category-response.dto';
import type { IProductCategory } from '@/models/product-category.model';
import type { FilterQuery, UpdateQuery } from 'mongoose';

export interface IProductCategoryRepository {
  create(data: Partial<IProductCategory>): Promise<IProductCategory>;
  findById(id: string): Promise<IProductCategory | null>;
  findByName(categoryName: string): Promise<IProductCategory | null>;
  findActiveCategories(): Promise<IProductCategory[]>;
  findWithPagination(
    filter?: FilterQuery<IProductCategory>,
    page?: number,
    limit?: number,
  ): Promise<{
    categories: IProductCategory[];
    total: number;
    totalPages: number;
  }>;
  updateById(
    id: string,
    update: UpdateQuery<IProductCategory>,
  ): Promise<IProductCategory | null>;
}

export interface IProductCategoryService {
  createProductCategory(
    data: CreateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto>;
  getProductCategoryById(
    id: string,
  ): Promise<ProductCategoryResponseDto | null>;
  getAllProductCategories(
    page?: number,
    limit?: number,
    status?: 'active' | 'inactive',
  ): Promise<{
    categories: ProductCategoryResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;
  getActiveProductCategories(): Promise<ProductCategoryResponseDto[]>;
  updateProductCategory(
    id: string,
    data: UpdateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto | null>;
  deleteProductCategory(id: string): Promise<boolean>;
}

export interface IProductCategoryController {
  createProductCategory(req: Request, res: Response): Promise<void>;
  getProductCategoryById(req: Request, res: Response): Promise<void>;
  getAllProductCategories(req: Request, res: Response): Promise<void>;
  getActiveProductCategories(req: Request, res: Response): Promise<void>;
  updateProductCategory(req: Request, res: Response): Promise<void>;
  deleteProductCategory(req: Request, res: Response): Promise<void>;
}
