import { ProductCategoryRepository } from '@/modules/product-category/product-category.repository';
import type { CreateProductCategoryDto } from '@/modules/product-category/dto/create-product-category.dto';
import type { UpdateProductCategoryDto } from '@/modules/product-category/dto/update-product-category.dto';
import type { ProductCategoryResponseDto } from '@/modules/product-category/dto/product-category-response.dto';
import type { IProductCategory } from '@/models/product-category.model';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';
import { UserModel } from '@/models/user.model';
import { Types } from 'mongoose';
import logger from '@/common/utils/logger';
import type {
  IProductCategoryService,
  IProductCategoryRepository,
} from '@/modules/product-category/interfaces/product-category.interface';

export class ProductCategoryService implements IProductCategoryService {
  private productCategoryRepository: IProductCategoryRepository;

  constructor() {
    this.productCategoryRepository = new ProductCategoryRepository();
  }

  public async createProductCategory(
    data: CreateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto> {
    try {
      logger.debug('Creating product category', { data });

      // Validate that the user exists
      await this.validateUserExists(data.createdBy);

      const existingCategory = await this.productCategoryRepository.findByName(
        data.categoryName,
      );
      if (existingCategory) {
        throw new DatabaseValidationException(
          `Product category with name '${data.categoryName}' already exists`,
        );
      }

      const categoryData = {
        categoryName: data.categoryName,
        sequenceNumber: data.sequenceNumber ?? 0,
        status: data.status ?? 'active',
        createdBy: new Types.ObjectId(data.createdBy),
      };

      const category =
        await this.productCategoryRepository.create(categoryData);
      logger.info('Product category created successfully', {
        id: category._id,
        name: category.categoryName,
        createdBy: data.createdBy,
      });

      return this.mapToResponseDto(category);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create product category:', {
        error: err.message,
        stack: err.stack,
        data,
      });
      throw error;
    }
  }

  private async validateUserExists(userId: string): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user || user.isDeleted) {
      throw new DatabaseValidationException('User not found or deleted');
    }
  }

  public async getProductCategoryById(
    id: string,
  ): Promise<ProductCategoryResponseDto | null> {
    try {
      logger.debug('Getting product category by ID', { id });
      const category = await this.productCategoryRepository.findById(id);

      if (!category || category.isDeleted) {
        logger.debug('Product category not found or deleted', { id });
        return null;
      }

      logger.debug('Product category found by ID', {
        id,
        name: category.categoryName,
      });
      return this.mapToResponseDto(category);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get product category by ID:', {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }

  public async getAllProductCategories(
    page: number = 1,
    limit: number = 10,
    status?: 'active' | 'inactive',
  ): Promise<{
    categories: ProductCategoryResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      logger.debug('Getting all product categories', { page, limit, status });

      const result = await this.fetchCategoriesWithPagination(
        page,
        limit,
        status,
      );

      this.logCategoriesRetrieved(result, page, limit);

      return this.formatCategoriesResponse(result, page, limit);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get all product categories:', {
        error: err.message,
        stack: err.stack,
        page,
        limit,
        status,
      });
      throw error;
    }
  }

  private async fetchCategoriesWithPagination(
    page: number,
    limit: number,
    status?: 'active' | 'inactive',
  ): Promise<{
    categories: IProductCategory[];
    total: number;
    totalPages: number;
  }> {
    const filter = status ? { status } : {};
    return this.productCategoryRepository.findWithPagination(
      filter,
      page,
      limit,
    );
  }

  private logCategoriesRetrieved(
    result: { categories: IProductCategory[]; total: number },
    page: number,
    limit: number,
  ): void {
    logger.debug('Product categories retrieved successfully', {
      count: result.categories.length,
      total: result.total,
      page,
      limit,
    });
  }

  private formatCategoriesResponse(
    result: {
      categories: IProductCategory[];
      total: number;
      totalPages: number;
    },
    page: number,
    limit: number,
  ): {
    categories: ProductCategoryResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } {
    return {
      categories: result.categories.map(category =>
        this.mapToResponseDto(category),
      ),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  public async getActiveProductCategories(): Promise<
    ProductCategoryResponseDto[]
  > {
    try {
      logger.debug('Getting active product categories');
      const categories =
        await this.productCategoryRepository.findActiveCategories();

      logger.debug('Active product categories retrieved successfully', {
        count: categories.length,
      });
      return categories.map(category => this.mapToResponseDto(category));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get active product categories:', {
        error: err.message,
        stack: err.stack,
      });
      throw error;
    }
  }

  public async updateProductCategory(
    id: string,
    data: UpdateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto | null> {
    try {
      logger.debug('Updating product category', { id, data });

      const existingCategory =
        await this.productCategoryRepository.findById(id);
      if (!existingCategory || existingCategory.isDeleted) {
        logger.debug('Product category not found for update', { id });
        return null;
      }

      await this.validateCategoryNameForUpdate(existingCategory, data, id);
      const updateData = this.buildUpdateData(data);
      const updatedCategory = await this.productCategoryRepository.updateById(
        id,
        updateData,
      );

      if (!updatedCategory) {
        logger.debug('Product category not found after update', { id });
        return null;
      }

      logger.info('Product category updated successfully', {
        id,
        name: updatedCategory.categoryName,
      });
      return this.mapToResponseDto(updatedCategory);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update product category:', {
        error: err.message,
        stack: err.stack,
        id,
        data,
      });
      throw error;
    }
  }

  private async validateCategoryNameForUpdate(
    existingCategory: IProductCategory,
    data: UpdateProductCategoryDto,
    id: string,
  ): Promise<void> {
    if (
      data.categoryName &&
      data.categoryName !== existingCategory.categoryName
    ) {
      const conflictingCategory =
        await this.productCategoryRepository.findByName(data.categoryName);
      if (conflictingCategory && conflictingCategory._id.toString() !== id) {
        throw new DatabaseValidationException(
          `Product category with name '${data.categoryName}' already exists`,
        );
      }
    }
  }

  private buildUpdateData(
    data: UpdateProductCategoryDto,
  ): Partial<IProductCategory> {
    const updateData: Partial<IProductCategory> = {};
    if (data.categoryName) {
      updateData.categoryName = data.categoryName.trim();
    }
    if (data.sequenceNumber !== undefined) {
      updateData.sequenceNumber = data.sequenceNumber;
    }
    if (data.status) {
      updateData.status = data.status;
    }
    return updateData;
  }

  public async deleteProductCategory(id: string): Promise<boolean> {
    try {
      logger.debug('Deleting product category', { id });

      const category = await this.productCategoryRepository.findById(id);
      if (!category || category.isDeleted) {
        logger.debug('Product category not found for deletion', { id });
        return false;
      }

      // Soft delete
      const updatedCategory = await this.productCategoryRepository.updateById(
        id,
        {
          isDeleted: true,
          deletedAt: new Date(),
        },
      );

      logger.info('Product category deleted successfully', {
        id,
        deleted: !!updatedCategory,
      });
      return !!updatedCategory;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete product category:', {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }

  private mapToResponseDto(
    category: IProductCategory,
  ): ProductCategoryResponseDto {
    // Handle populated createdBy field
    const createdByInfo = category.createdBy as unknown;

    let createdById: string;
    let createdByName: string | undefined;

    if (
      createdByInfo &&
      typeof createdByInfo === 'object' &&
      '_id' in createdByInfo
    ) {
      // createdBy is populated with user details
      const userInfo = createdByInfo as {
        _id: string;
        firstName?: string;
        lastName?: string;
        email?: string;
      };
      createdById = userInfo._id;
      createdByName =
        userInfo.firstName && userInfo.lastName
          ? `${userInfo.firstName} ${userInfo.lastName}`
          : undefined;
    } else {
      // createdBy is just an ObjectId
      createdById =
        category.createdBy instanceof Types.ObjectId
          ? category.createdBy.toString()
          : String(category.createdBy);
    }

    return {
      _id: category._id,
      categoryName: category.categoryName,
      sequenceNumber: category.sequenceNumber,
      status: category.status,
      createdBy: createdById,
      createdByName,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
