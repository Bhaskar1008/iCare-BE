import type { Request, Response } from 'express';
import { BaseController } from '@/controllers/base.controller';
import { ProductService } from '@/modules/product/product.service';
import type { CreateProductDto } from '@/modules/product/dto/create-product.dto';
import type { UpdateProductDto } from '@/modules/product/dto/update-product.dto';
import type { ProductQueryDto } from '@/modules/product/dto/product-query.dto';
import type { S3UploadRequestDto } from '@/modules/product/dto/s3-upload.dto';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';
import {
  HTTP_STATUS,
  PAGINATION,
} from '@/common/constants/http-status.constants';
import logger from '@/common/utils/logger';
import type {
  IProductController,
  IProductService,
} from '@/modules/product/interfaces/product.interface';
import type { ValidatedRequest } from '@/common/interfaces/validation.interface';

export class ProductController
  extends BaseController
  implements IProductController
{
  private productService: IProductService;

  constructor() {
    super();
    this.productService = new ProductService();
  }

  public createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.debug('Create product request received', req.body);

      const productData = req.body as CreateProductDto;
      const product = await this.productService.createProduct(productData);

      logger.info('Product created successfully', {
        id: product._id,
        name: product.productName,
      });

      this.sendCreated(res, product, 'Product created successfully');
    } catch (error) {
      this.handleCreateProductError(error, req, res);
    }
  };

  private handleCreateProductError(
    error: unknown,
    req: Request,
    res: Response,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to create product:', {
      error: err.message,
      stack: err.stack,
    });

    if (error instanceof DatabaseValidationException) {
      this.sendBadRequest(res, err.message);
      return;
    }

    this.sendError(
      res,
      'Failed to create product',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }

  public getProductById = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Get product by ID request received', { id });

      if (!id) {
        this.sendBadRequest(res, 'Product ID is required');
        return;
      }

      const product = await this.productService.getProductById(id);

      if (!product) {
        this.sendNotFound(res, 'Product not found');
        return;
      }

      logger.debug('Product retrieved successfully', {
        id,
        name: product.productName,
      });
      this.sendSuccess(res, product, 'Product retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get product by ID:', {
        error: err.message,
        stack: err.stack,
        id: req.params.id,
      });

      this.sendError(
        res,
        'Failed to retrieve product',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getAllProducts = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Get all products request received', { query: req.query });

      const queryParams = (req as ValidatedRequest<ProductQueryDto>)
        .validatedQuery;
      const page = queryParams.page
        ? parseInt(queryParams.page, 10)
        : PAGINATION.DEFAULT_PAGE;
      const limit = queryParams.limit
        ? parseInt(queryParams.limit, 10)
        : PAGINATION.DEFAULT_LIMIT;
      const status = queryParams.status;
      const categoryId = queryParams.categoryId;
      const channelId = queryParams.channelId;

      const result = await this.productService.getAllProducts(
        page,
        limit,
        status,
        categoryId,
        channelId,
      );

      logger.debug('Products retrieved successfully', {
        count: result.products.length,
        total: result.pagination.total,
        page,
        limit,
      });

      this.sendSuccess(res, result, 'Products retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get all products:', {
        error: err.message,
        stack: err.stack,
        query: req.query,
      });

      this.sendError(
        res,
        'Failed to retrieve products',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getActiveProducts = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      logger.debug('Get active products request received');

      const products = await this.productService.getActiveProducts();

      logger.debug('Active products retrieved successfully', {
        count: products.length,
      });
      this.sendSuccess(res, products, 'Active products retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get active products:', {
        error: err.message,
        stack: err.stack,
      });

      this.sendError(
        res,
        'Failed to retrieve active products',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getProductsByCategory = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { categoryId } = req.params;
      logger.debug('Get products by category request received', { categoryId });

      if (!categoryId) {
        this.sendBadRequest(res, 'Category ID is required');
        return;
      }

      const products =
        await this.productService.getProductsByCategory(categoryId);

      logger.debug('Products by category retrieved successfully', {
        categoryId,
        count: products.length,
      });
      this.sendSuccess(res, products, 'Products retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get products by category:', {
        error: err.message,
        stack: err.stack,
        categoryId: req.params.categoryId,
      });

      this.sendError(
        res,
        'Failed to retrieve products',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public getProductsByChannel = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { channelId } = req.params;
      logger.debug('Get products by channel request received', { channelId });

      if (!channelId) {
        this.sendBadRequest(res, 'Channel ID is required');
        return;
      }

      const products =
        await this.productService.getProductsByChannel(channelId);

      logger.debug('Products by channel retrieved successfully', {
        channelId,
        count: products.length,
      });
      this.sendSuccess(res, products, 'Products retrieved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get products by channel:', {
        error: err.message,
        stack: err.stack,
        channelId: req.params.channelId,
      });

      this.sendError(
        res,
        'Failed to retrieve products',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Update product request received', {
        id,
        body: req.body,
      });

      if (!id) {
        this.sendBadRequest(res, 'Product ID is required');
        return;
      }

      const updateData = req.body as UpdateProductDto;
      if (Object.keys(updateData).length === 0) {
        this.sendBadRequest(res, 'At least one field is required for update');
        return;
      }

      const product = await this.productService.updateProduct(id, updateData);
      if (!product) {
        this.sendNotFound(res, 'Product not found');
        return;
      }

      logger.info('Product updated successfully', { id });
      this.sendSuccess(res, product, 'Product updated successfully');
    } catch (error) {
      this.handleUpdateProductError(error, req, res);
    }
  };

  private handleUpdateProductError(
    error: unknown,
    req: Request,
    res: Response,
  ): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update product:', {
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
      'Failed to update product',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }

  public deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Delete product request received', { id });

      if (!id) {
        this.sendBadRequest(res, 'Product ID is required');
        return;
      }

      const deleted = await this.productService.deleteProduct(id);

      if (!deleted) {
        this.sendNotFound(res, 'Product not found');
        return;
      }

      logger.info('Product deleted successfully', { id });
      this.sendSuccess(res, { deleted: true }, 'Product deleted successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete product:', {
        error: err.message,
        stack: err.stack,
        id: req.params.id,
      });

      this.sendError(
        res,
        'Failed to delete product',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };

  public uploadToS3 = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.debug('File upload request received', {
        body: req.body,
        files: req.files,
      });

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        this.sendBadRequest(res, 'No files uploaded');
        return;
      }

      const uploadData = req.body as S3UploadRequestDto;
      const result = await this.productService.uploadToS3(
        uploadData,
        req.files,
      );

      logger.info('Files uploaded successfully', {
        userId: uploadData.userId,
        fileType: uploadData.fileType,
        fileCount: req.files.length,
      });

      this.sendSuccess(res, result, 'Files uploaded successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to upload files:', {
        error: err.message,
        stack: err.stack,
        body: req.body,
      });

      if (error instanceof DatabaseValidationException) {
        this.sendBadRequest(res, err.message);
        return;
      }

      this.sendError(
        res,
        'Failed to upload files',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err,
      );
    }
  };
}
