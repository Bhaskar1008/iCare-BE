import type { Request, Response } from 'express';
import { BaseController } from '@/controllers/base.controller';
import { ProductCategoryService } from '@/modules/product-category/product-category.service';
import type { CreateProductCategoryDto } from '@/modules/product-category/dto/create-product-category.dto';
import type { UpdateProductCategoryDto } from '@/modules/product-category/dto/update-product-category.dto';
import type { ProductCategoryQueryDto } from '@/modules/product-category/dto/product-category-query.dto';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';
import {
  HTTP_STATUS,
  PAGINATION,
} from '@/common/constants/http-status.constants';
import logger from '@/common/utils/logger';
import type {
  IProductCategoryController,
  IProductCategoryService,
} from '@/modules/product-category/interfaces/product-category.interface';
import type { ValidatedRequest } from '@/common/interfaces/validation.interface';

export class ProductCategoryController
  extends BaseController
  implements IProductCategoryController
{
  private productCategoryService: IProductCategoryService;

  constructor() {
    super();
    this.productCategoryService = new ProductCategoryService();
  }

  public createProductCategory = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Create product category request received', req.body);

      // req.body is now validated and transformed by ValidationPipe
      const categoryData = req.body as CreateProductCategoryDto;
      const category =
        await this.productCategoryService.createProductCategory(categoryData);

      logger.info('Product category created successfully', {
        id: category._id,
        name: category.categoryName,
      });

      this.sendCreated(res, category, 'Product category created successfully');
    } catch (error) {
      this.handleCreateCategoryError(error, req, res);
    }
  };

  private handleCreateCategoryError(
    error: unknown,
    req: Request,
    res: Response,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to create product category:', {
      error: err.message,
      stack: err.stack,
    });

    if (error instanceof DatabaseValidationException) {
      this.sendBadRequest(res, err.message);
      return;
    }

    this.sendError(
      res,
      'Failed to create product category',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }

  public getProductCategoryById = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Get product category by ID request received', { id });

      if (!id) {
        this.sendBadRequest(res, 'Product category ID is required');
        return;
      }

      const category =
        await this.productCategoryService.getProductCategoryById(id);

      if (!category) {
        this.sendNotFound(res, 'Product category not found');
        return;
      }

      logger.debug('Product category retrieved successfully', {
        id,
        name: category.categoryName,
      });
      this.sendSuccess(
        res,
        category,
        'Product category retrieved successfully',
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get product category by ID:', {
        error: err.message,
        stack: err.stack,
        id: req.params.id,
      });

      this.sendError(
        res,
        'Failed to retrieve product category',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getAllProductCategories = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Get all product categories request received', {
        query: req.query,
      });

      const queryParams = (req as ValidatedRequest<ProductCategoryQueryDto>)
        .validatedQuery;
      const page = queryParams.page
        ? parseInt(queryParams.page, 10)
        : PAGINATION.DEFAULT_PAGE;
      const limit = queryParams.limit
        ? parseInt(queryParams.limit, 10)
        : PAGINATION.DEFAULT_LIMIT;
      const status = queryParams.status;

      const result = await this.productCategoryService.getAllProductCategories(
        page,
        limit,
        status,
      );

      logger.debug('Product categories retrieved successfully', {
        count: result.categories.length,
        total: result.pagination.total,
        page,
        limit,
      });

      this.sendSuccess(
        res,
        result,
        'Product categories retrieved successfully',
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get all product categories:', {
        error: err.message,
        stack: err.stack,
        query: req.query,
      });

      this.sendError(
        res,
        'Failed to retrieve product categories',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getActiveProductCategories = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Get active product categories request received');

      const categories =
        await this.productCategoryService.getActiveProductCategories();

      logger.debug('Active product categories retrieved successfully', {
        count: categories.length,
      });
      this.sendSuccess(
        res,
        categories,
        'Active product categories retrieved successfully',
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get active product categories:', {
        error: err.message,
        stack: err.stack,
      });

      this.sendError(
        res,
        'Failed to retrieve active product categories',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public updateProductCategory = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Update product category request received', {
        id,
        body: req.body,
      });

      if (!id) {
        this.sendBadRequest(res, 'Product category ID is required');
        return;
      }

      // req.body is now validated and transformed by ValidationPipe
      const updateData = req.body as UpdateProductCategoryDto;
      if (Object.keys(updateData).length === 0) {
        this.sendBadRequest(res, 'At least one field is required for update');
        return;
      }

      const category = await this.productCategoryService.updateProductCategory(
        id,
        updateData,
      );
      if (!category) {
        this.sendNotFound(res, 'Product category not found');
        return;
      }

      logger.info('Product category updated successfully', { id });
      this.sendSuccess(res, category, 'Product category updated successfully');
    } catch (error) {
      this.handleUpdateCategoryError(error, req, res);
    }
  };

  private handleUpdateCategoryError(
    error: unknown,
    req: Request,
    res: Response,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update product category:', {
      error: err.message,
      stack: err.stack,
      id: req.params.id,
      body: req.body,
    });

    if (error instanceof DatabaseValidationException) {
      this.sendBadRequest(res, err.message);
      return;
    }

    this.sendError(
      res,
      'Failed to update product category',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }

  public deleteProductCategory = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Delete product category request received', { id });

      if (!id) {
        this.sendBadRequest(res, 'Product category ID is required');
        return;
      }

      const deleted =
        await this.productCategoryService.deleteProductCategory(id);

      if (!deleted) {
        this.sendNotFound(res, 'Product category not found');
        return;
      }

      logger.info('Product category deleted successfully', { id });
      this.sendSuccess(
        res,
        { deleted: true },
        'Product category deleted successfully',
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete product category:', {
        error: err.message,
        stack: err.stack,
        id: req.params.id,
      });

      this.sendError(
        res,
        'Failed to delete product category',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };
}
