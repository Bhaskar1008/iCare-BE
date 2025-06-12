import { BaseRepository } from '@/repository/base.repository';
import {
  ProductCategoryModel,
  type IProductCategory,
} from '@/models/product-category.model';
import type { FilterQuery } from 'mongoose';
import logger from '@/common/utils/logger';
import type { IProductCategoryRepository } from '@/modules/product-category/interfaces/product-category.interface';

export class ProductCategoryRepository
  extends BaseRepository<IProductCategory>
  implements IProductCategoryRepository
{
  constructor() {
    super(ProductCategoryModel);
  }

  public async findByName(
    categoryName: string,
  ): Promise<IProductCategory | null> {
    try {
      logger.debug('Finding product category by name', { categoryName });
      const result = await this.model
        .findOne({ categoryName, isDeleted: false })
        .populate('createdBy', 'firstName lastName email')
        .exec();
      logger.debug('Product category found by name', {
        categoryName,
        found: !!result,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find product category by name:', {
        error: err.message,
        stack: err.stack,
        categoryName,
      });
      throw error;
    }
  }

  public async findActiveCategories(): Promise<IProductCategory[]> {
    try {
      logger.debug('Finding active product categories');
      const result = await this.model
        .find({ status: 'active', isDeleted: false })
        .populate('createdBy', 'firstName lastName email')
        .sort({ sequenceNumber: 1, createdAt: -1 })
        .exec();
      logger.debug('Active product categories found', { count: result.length });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find active product categories:', {
        error: err.message,
        stack: err.stack,
      });
      throw error;
    }
  }

  public async findWithPagination(
    filter: FilterQuery<IProductCategory> = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    categories: IProductCategory[];
    total: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const baseFilter = { ...filter, isDeleted: false };

      logger.debug('Finding product categories with pagination', {
        filter: baseFilter,
        page,
        limit,
        skip,
      });

      const [categories, total] = await Promise.all([
        this.model
          .find(baseFilter)
          .populate('createdBy', 'firstName lastName email')
          .sort({ sequenceNumber: 1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.model.countDocuments(baseFilter).exec(),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.debug('Product categories found with pagination', {
        count: categories.length,
        total,
        totalPages,
        page,
        limit,
      });

      return { categories, total, totalPages };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find product categories with pagination:', {
        error: err.message,
        stack: err.stack,
        filter,
        page,
        limit,
      });
      throw error;
    }
  }

  public async findById(id: string): Promise<IProductCategory | null> {
    try {
      logger.debug('Finding product category by ID', { id });
      const result = await this.model
        .findById(id)
        .populate('createdBy', 'firstName lastName email')
        .exec();
      logger.debug('Product category found by ID', { id, found: !!result });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find product category by ID:', {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }
}
