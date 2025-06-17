import { BaseRepository } from '@/repository/base.repository';
import { ProductModel, type IProduct } from '@/models/product.model';
import type { FilterQuery, Query } from 'mongoose';
import { Types } from 'mongoose';
import logger from '@/common/utils/logger';
import type { IProductRepository } from '@/modules/product/interfaces/product.interface';

export class ProductRepository
  extends BaseRepository<IProduct>
  implements IProductRepository
{
  constructor() {
    super(ProductModel);
  }

  public find(query: FilterQuery<IProduct>): Query<IProduct[], IProduct> {
    logger.debug('Finding documents', { query });
    return this.model.find(query);
  }

  public async countDocuments(query: FilterQuery<IProduct>): Promise<number> {
    try {
      logger.debug('Counting documents', { query });
      const count = await this.model.countDocuments(query).exec();
      logger.debug('Documents counted', { count });
      return count;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to count documents:', {
        error: err.message,
        stack: err.stack,
        query,
      });
      throw error;
    }
  }

  public async findByName(productName: string): Promise<IProduct | null> {
    try {
      logger.debug('Finding product by name', { productName });
      const result = await this.model
        .findOne({ productName, isDeleted: false })
        .populate('productCategoryId', 'categoryName')
        .populate('channelIds', 'channelName channelCode')
        .populate('createdBy', 'firstName lastName email')
        .populate('files.categoryId', 'categoryName')
        .exec();
      logger.debug('Product found by name', { productName, found: !!result });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find product by name:', {
        error: err.message,
        stack: err.stack,
        productName,
      });
      throw error;
    }
  }

  public async findActiveProducts(): Promise<IProduct[]> {
    try {
      logger.debug('Finding active products');
      const result = await this.model
        .find({ status: 'active', isDeleted: false })
        .populate('productCategoryId', 'categoryName')
        .populate('channelIds', 'channelName channelCode')
        .populate('createdBy', 'firstName lastName email')
        .populate('files.categoryId', 'categoryName')
        .sort({ createdAt: -1 })
        .exec();
      logger.debug('Active products found', { count: result.length });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find active products:', {
        error: err.message,
        stack: err.stack,
      });
      throw error;
    }
  }

  public async findByCategory(categoryId: string): Promise<IProduct[]> {
    try {
      logger.debug('Finding products by category', { categoryId });
      const result = await this.model
        .find({
          productCategoryId: new Types.ObjectId(categoryId),
          isDeleted: false,
        })
        .populate('productCategoryId', 'categoryName')
        .populate('channelIds', 'channelName channelCode')
        .populate('createdBy', 'firstName lastName email')
        .populate('files.categoryId', 'categoryName')
        .sort({ createdAt: -1 })
        .exec();
      logger.debug('Products found by category', {
        categoryId,
        count: result.length,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find products by category:', {
        error: err.message,
        stack: err.stack,
        categoryId,
      });
      throw error;
    }
  }

  public async findByChannel(channelId: string): Promise<IProduct[]> {
    try {
      logger.debug('Finding products by channel', { channelId });
      const result = await this.model
        .find({
          channelIds: new Types.ObjectId(channelId),
          isDeleted: false,
        })
        .populate('productCategoryId', 'categoryName')
        .populate('channelIds', 'channelName channelCode')
        .populate('createdBy', 'firstName lastName email')
        .populate('files.categoryId', 'categoryName')
        .sort({ createdAt: -1 })
        .exec();
      logger.debug('Products found by channel', {
        channelId,
        count: result.length,
      });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find products by channel:', {
        error: err.message,
        stack: err.stack,
        channelId,
      });
      throw error;
    }
  }

  public async findWithPagination(
    filter: FilterQuery<IProduct> = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<{ products: IProduct[]; total: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const baseFilter = { ...filter, isDeleted: false };

      logger.debug('Finding products with pagination', {
        filter: baseFilter,
        page,
        limit,
        skip,
      });

      const [products, total] = await Promise.all([
        this.model
          .find(baseFilter)
          .populate('productCategoryId', 'categoryName')
          .populate('channelIds', 'channelName channelCode')
          .populate('createdBy', 'firstName lastName email')
          .populate('files.categoryId', 'categoryName')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.model.countDocuments(baseFilter).exec(),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.debug('Products found with pagination', {
        count: products.length,
        total,
        totalPages,
        page,
        limit,
      });

      return { products, total, totalPages };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find products with pagination:', {
        error: err.message,
        stack: err.stack,
        filter,
        page,
        limit,
      });
      throw error;
    }
  }

  public async findById(id: string): Promise<IProduct | null> {
    try {
      logger.debug('Finding product by ID', { id });
      const result = await this.model
        .findById(id)
        .populate('productCategoryId', 'categoryName')
        .populate('channelIds', 'channelName channelCode')
        .populate('createdBy', 'firstName lastName email')
        .populate('files.categoryId', 'categoryName')
        .exec();
      logger.debug('Product found by ID', { id, found: !!result });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to find product by ID:', {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }

  public async softDelete(id: string): Promise<boolean> {
    try {
      logger.debug('Soft deleting document by ID', { id });
      const result = await this.model.findByIdAndUpdate(
        id,
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      );
      logger.debug('Document soft deleted', { id, success: !!result });
      return !!result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to soft delete document:', {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }

  public override async deleteById(id: string): Promise<IProduct | null> {
    try {
      logger.debug('Deleting document by ID', { id });
      const result = await this.model.findByIdAndUpdate(
        id,
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      );
      logger.debug('Document deleted', { id, success: !!result });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete document:', {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }
}
