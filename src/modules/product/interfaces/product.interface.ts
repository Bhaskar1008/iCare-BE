import type { Request, Response } from 'express';
import type { CreateProductDto } from '../dto/create-product.dto';
import type { UpdateProductDto } from '../dto/update-product.dto';
import type { ProductResponseDto } from '../dto/product-response.dto';
import type {
  S3UploadRequestDto,
  S3UploadResponseDto,
} from '../dto/s3-upload.dto';
import type { IProduct } from '@/models/product.model';
import type { FilterQuery, Query } from 'mongoose';

export interface IProductRepository {
  create(data: Partial<IProduct>): Promise<IProduct>;
  findById(id: string): Promise<IProduct | null>;
  find(query: FilterQuery<IProduct>): Query<IProduct[], IProduct>;
  countDocuments(query: FilterQuery<IProduct>): Promise<number>;
  findOne(query: FilterQuery<IProduct>): Promise<IProduct | null>;
  findByName(productName: string): Promise<IProduct | null>;
  findActiveProducts(): Promise<IProduct[]>;
  findByCategory(categoryId: string): Promise<IProduct[]>;
  findByChannel(channelId: string): Promise<IProduct[]>;
  findWithPagination(
    filter?: FilterQuery<IProduct>,
    page?: number,
    limit?: number,
  ): Promise<{ products: IProduct[]; total: number; totalPages: number }>;
  updateById(id: string, data: Partial<IProduct>): Promise<IProduct | null>;
  deleteById(id: string): Promise<IProduct | null>;
  softDelete(id: string): Promise<boolean>;
}

export interface IProductService {
  createProduct(data: CreateProductDto): Promise<ProductResponseDto>;
  getProductById(id: string): Promise<ProductResponseDto | null>;
  getAllProducts(
    page: number,
    limit: number,
    status?: string,
    categoryId?: string,
    channelId?: string,
  ): Promise<{
    products: ProductResponseDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }>;
  getActiveProducts(): Promise<ProductResponseDto[]>;
  getProductsByCategory(categoryId: string): Promise<ProductResponseDto[]>;
  getProductsByChannel(channelId: string): Promise<ProductResponseDto[]>;
  updateProduct(
    id: string,
    data: UpdateProductDto,
  ): Promise<ProductResponseDto | null>;
  deleteProduct(id: string): Promise<boolean>;
  uploadToS3(
    data: S3UploadRequestDto,
    files: Express.Multer.File[],
  ): Promise<S3UploadResponseDto>;
}

export interface IProductController {
  createProduct(req: Request, res: Response): Promise<void>;
  getProductById(req: Request, res: Response): Promise<void>;
  getAllProducts(req: Request, res: Response): Promise<void>;
  getActiveProducts(req: Request, res: Response): Promise<void>;
  getProductsByCategory(req: Request, res: Response): Promise<void>;
  getProductsByChannel(req: Request, res: Response): Promise<void>;
  updateProduct(req: Request, res: Response): Promise<void>;
  deleteProduct(req: Request, res: Response): Promise<void>;
  uploadToS3(req: Request, res: Response): Promise<void>;
}
