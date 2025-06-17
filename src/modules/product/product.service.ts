import { ProductRepository } from '@/modules/product/product.repository';
import type { CreateProductDto } from '@/modules/product/dto/create-product.dto';
import type { UpdateProductDto } from '@/modules/product/dto/update-product.dto';
import type { ProductResponseDto } from '@/modules/product/dto/product-response.dto';
import type {
  S3UploadRequestDto,
  S3UploadResponseDto,
} from '@/modules/product/dto/s3-upload.dto';
import type {
  IProductService,
  IProductRepository,
} from '@/modules/product/interfaces/product.interface';
import type { IProduct } from '@/models/product.model';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';
import { UserModel } from '@/models/user.model';
import { ProductCategoryModel } from '@/models/product-category.model';
import { ChannelModel } from '@/models/channel.model';
import { S3Service } from '@/services/s3.service';
import { Types, type FilterQuery } from 'mongoose';
import logger from '@/common/utils/logger';
import path from 'path';
import { PAGINATION } from '@/common/constants/pagination.constant';

export class ProductService implements IProductService {
  private productRepository: IProductRepository;
  private s3Service: S3Service;

  constructor() {
    this.productRepository = new ProductRepository();
    this.s3Service = new S3Service();
  }

  public async createProduct(
    data: CreateProductDto,
  ): Promise<ProductResponseDto> {
    try {
      logger.debug('Creating product', { data });

      // Validate dependencies
      await this.validateDependencies(data);

      // Check if product name already exists
      const existingProduct = await this.productRepository.findByName(
        data.productName,
      );
      if (existingProduct) {
        throw new DatabaseValidationException(
          `Product with name '${data.productName}' already exists`,
        );
      }

      const productData = this.buildProductCreateData(data);
      const product = await this.productRepository.create(productData);

      logger.info('Product created successfully', {
        id: product._id,
        name: product.productName,
        createdBy: data.createdBy,
      });

      return this.mapToResponseDto(product);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create product:', {
        error: err.message,
        stack: err.stack,
        data,
      });
      throw error;
    }
  }

  private async validateDependencies(data: CreateProductDto): Promise<void> {
    // Validate user exists
    const user = await UserModel.findById(data.createdBy);
    if (!user || user.isDeleted) {
      throw new DatabaseValidationException('User not found or deleted');
    }

    // Validate product category exists
    const category = await ProductCategoryModel.findById(
      data.productCategoryId,
    );
    if (!category || category.isDeleted) {
      throw new DatabaseValidationException(
        'Product category not found or deleted',
      );
    }

    // Validate all channels exist
    const channels = await ChannelModel.find({
      _id: { $in: data.channelIds.map(id => new Types.ObjectId(id)) },
      isDeleted: false,
    });
    if (channels.length !== data.channelIds.length) {
      throw new DatabaseValidationException(
        'One or more channels not found or deleted',
      );
    }

    // Validate file categories if files are provided
    if (data.files && data.files.length > 0) {
      const fileCategoryIds = data.files.map(file => file.categoryId);
      const fileCategories = await ProductCategoryModel.find({
        _id: { $in: fileCategoryIds.map(id => new Types.ObjectId(id)) },
        isDeleted: false,
      });
      if (fileCategories.length !== fileCategoryIds.length) {
        throw new DatabaseValidationException(
          'One or more file categories not found or deleted',
        );
      }
    }
  }

  private buildProductCreateData(data: CreateProductDto): Partial<IProduct> {
    return {
      productCategoryId: new Types.ObjectId(data.productCategoryId),
      channelIds: data.channelIds.map(id => new Types.ObjectId(id)),
      productName: data.productName.trim(),
      status: data.status ?? 'active',
      webLink: data.webLink?.trim(),
      applicationId: data.applicationId?.trim(),
      productDescription: data.productDescription?.trim(),
      reasonsToBuy: data.reasonsToBuy,
      media: {
        videos:
          data.media?.videos?.map(video => ({
            title: video.title,
            s3Links: video.s3Links ?? [],
            youtubeUrl: video.youtubeUrl,
            isActive: video.isActive ?? true,
            uploadedAt: new Date(),
          })) ?? [],
        images:
          data.media?.images?.map(image => ({
            title: image.title,
            s3Link: image.s3Link,
            isActive: image.isActive ?? true,
            uploadedAt: new Date(),
          })) ?? [],
      },
      files:
        data.files?.map(file => ({
          ...file,
          categoryId: new Types.ObjectId(file.categoryId),
          uploadedAt: new Date(),
        })) ?? [],
      createdBy: new Types.ObjectId(data.createdBy),
    };
  }

  public async getProductById(id: string): Promise<ProductResponseDto | null> {
    try {
      logger.debug('Getting product by ID', { id });
      const product = await this.productRepository.findById(id);

      if (!product || product.isDeleted) {
        logger.debug('Product not found or deleted', { id });
        return null;
      }

      logger.debug('Product found by ID', { id, name: product.productName });
      return this.mapToResponseDto(product);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get product by ID:', {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }

  public async getAllProducts(
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT,
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
  }> {
    try {
      logger.debug('Getting all products', {
        page,
        limit,
        status,
        categoryId,
        channelId,
      });

      const filter = this.buildProductFilter(status, categoryId, channelId);
      const result = await this.productRepository.findWithPagination(
        filter,
        page,
        limit,
      );

      return {
        products: result.products.map(product =>
          this.mapToResponseDto(product),
        ),
        pagination: {
          total: result.total,
          page,
          limit,
          pages: result.totalPages,
        },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get all products:', {
        error: err.message,
        stack: err.stack,
        page,
        limit,
        status,
        categoryId,
        channelId,
      });
      throw error;
    }
  }

  private buildProductFilter(
    status?: string,
    categoryId?: string,
    channelId?: string,
  ): FilterQuery<IProduct> {
    const filter: FilterQuery<IProduct> = { isDeleted: false };

    if (status) {
      filter.status = status;
    }
    if (categoryId) {
      filter.productCategoryId = new Types.ObjectId(categoryId);
    }
    if (channelId) {
      filter.channelIds = new Types.ObjectId(channelId);
    }

    return filter;
  }

  public async getActiveProducts(): Promise<ProductResponseDto[]> {
    try {
      logger.debug('Getting active products');
      const products = await this.productRepository.findActiveProducts();

      logger.debug('Active products retrieved successfully', {
        count: products.length,
      });
      return products.map(product => this.mapToResponseDto(product));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get active products:', {
        error: err.message,
        stack: err.stack,
      });
      throw error;
    }
  }

  public async getProductsByCategory(
    categoryId: string,
  ): Promise<ProductResponseDto[]> {
    try {
      logger.debug('Getting products by category', { categoryId });
      const products = await this.productRepository.findByCategory(categoryId);

      logger.debug('Products by category retrieved successfully', {
        categoryId,
        count: products.length,
      });
      return products.map(product => this.mapToResponseDto(product));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get products by category:', {
        error: err.message,
        stack: err.stack,
        categoryId,
      });
      throw error;
    }
  }

  public async getProductsByChannel(
    channelId: string,
  ): Promise<ProductResponseDto[]> {
    try {
      logger.debug('Getting products by channel', { channelId });
      const products = await this.productRepository.findByChannel(channelId);

      logger.debug('Products by channel retrieved successfully', {
        channelId,
        count: products.length,
      });
      return products.map(product => this.mapToResponseDto(product));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get products by channel:', {
        error: err.message,
        stack: err.stack,
        channelId,
      });
      throw error;
    }
  }

  public async updateProduct(
    id: string,
    data: UpdateProductDto,
  ): Promise<ProductResponseDto | null> {
    try {
      logger.debug('Updating product', { id, data });

      const existingProduct = await this.productRepository.findById(id);
      if (!existingProduct || existingProduct.isDeleted) {
        logger.debug('Product not found for update', { id });
        return null;
      }

      await this.validateUpdateDependencies(data);
      await this.validateProductNameForUpdate(existingProduct, data, id);

      const updateData = this.buildUpdateData(data);
      const updatedProduct = await this.productRepository.updateById(
        id,
        updateData,
      );

      if (!updatedProduct) {
        logger.debug('Product not found after update', { id });
        return null;
      }

      logger.info('Product updated successfully', {
        id,
        name: updatedProduct.productName,
      });
      return this.mapToResponseDto(updatedProduct);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update product:', {
        error: err.message,
        stack: err.stack,
        id,
        data,
      });
      throw error;
    }
  }

  private async validateUpdateDependencies(
    data: UpdateProductDto,
  ): Promise<void> {
    if (data.productCategoryId) {
      const category = await ProductCategoryModel.findById(
        data.productCategoryId,
      );
      if (!category || category.isDeleted) {
        throw new DatabaseValidationException(
          'Product category not found or deleted',
        );
      }
    }

    if (data.channelIds && data.channelIds.length > 0) {
      const channels = await ChannelModel.find({
        _id: { $in: data.channelIds.map(id => new Types.ObjectId(id)) },
        isDeleted: false,
      });
      if (channels.length !== data.channelIds.length) {
        throw new DatabaseValidationException(
          'One or more channels not found or deleted',
        );
      }
    }

    if (data.files && data.files.length > 0) {
      const fileCategoryIds = data.files.map(file => file.categoryId);
      const fileCategories = await ProductCategoryModel.find({
        _id: { $in: fileCategoryIds.map(id => new Types.ObjectId(id)) },
        isDeleted: false,
      });
      if (fileCategories.length !== fileCategoryIds.length) {
        throw new DatabaseValidationException(
          'One or more file categories not found or deleted',
        );
      }
    }
  }

  private async validateProductNameForUpdate(
    existingProduct: IProduct,
    data: UpdateProductDto,
    id: string,
  ): Promise<void> {
    if (data.productName && data.productName !== existingProduct.productName) {
      const conflictingProduct = await this.productRepository.findByName(
        data.productName,
      );
      if (conflictingProduct && conflictingProduct._id.toString() !== id) {
        throw new DatabaseValidationException(
          `Product with name '${data.productName}' already exists`,
        );
      }
    }
  }

  private buildUpdateData(data: UpdateProductDto): Partial<IProduct> {
    const updateData: Partial<IProduct> = {};

    if (data.productCategoryId) {
      updateData.productCategoryId = new Types.ObjectId(data.productCategoryId);
    }
    if (data.channelIds) {
      updateData.channelIds = data.channelIds.map(id => new Types.ObjectId(id));
    }
    if (data.productName) {
      updateData.productName = data.productName.trim();
    }
    if (data.status) {
      updateData.status = data.status;
    }
    if (data.webLink !== undefined) {
      updateData.webLink = data.webLink?.trim();
    }
    if (data.applicationId !== undefined) {
      updateData.applicationId = data.applicationId?.trim();
    }
    if (data.productDescription !== undefined) {
      updateData.productDescription = data.productDescription?.trim();
    }
    if (data.reasonsToBuy) {
      updateData.reasonsToBuy = data.reasonsToBuy;
    }
    if (data.media) {
      updateData.media = {
        videos:
          data.media.videos?.map(video => ({
            title: video.title,
            s3Links: video.s3Links ?? [],
            youtubeUrl: video.youtubeUrl,
            isActive: video.isActive ?? true,
            uploadedAt: new Date(),
          })) ?? [],
        images:
          data.media.images?.map(image => ({
            title: image.title,
            s3Link: image.s3Link,
            isActive: image.isActive ?? true,
            uploadedAt: new Date(),
          })) ?? [],
      };
    }
    if (data.files) {
      updateData.files = data.files.map(file => ({
        ...file,
        categoryId: new Types.ObjectId(file.categoryId),
        uploadedAt: new Date(),
      }));
    }

    return updateData;
  }

  public async deleteProduct(id: string): Promise<boolean> {
    try {
      logger.debug('Deleting product', { id });

      const product = await this.productRepository.findById(id);
      if (!product || product.isDeleted) {
        logger.debug('Product not found for deletion', { id });
        return false;
      }

      // Soft delete
      const deleted = await this.productRepository.deleteById(id);

      logger.info('Product deleted successfully', {
        id,
        deleted: !!deleted,
      });
      return !!deleted;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete product:', {
        error: err.message,
        stack: err.stack,
        id,
      });
      throw error;
    }
  }

  public async uploadToS3(
    data: S3UploadRequestDto,
    files: Express.Multer.File[],
  ): Promise<S3UploadResponseDto> {
    try {
      logger.debug('Uploading files to S3', {
        userId: data.userId,
        fileType: data.fileType,
        isMultiple: data.isMultiple,
        fileCount: files.length,
      });

      // Validate user exists
      const user = await UserModel.findById(data.userId);
      if (!user || user.isDeleted) {
        throw new DatabaseValidationException('User not found or deleted');
      }

      // Validate file types based on fileType parameter
      this.validateFileTypes(files, data.fileType);

      const timestamp = Date.now();

      // Handle multiple files
      if (data.isMultiple && files.length > 1) {
        const uploadResults = await Promise.all(
          files.map((file, index) => {
            const fileExtension = path.extname(file.originalname);
            const key = `${data.userId}/${data.fileType}/${timestamp}_${index}${fileExtension}`;
            return this.s3Service.uploadFile(key, file.buffer, file.mimetype);
          }),
        );

        logger.info('Multiple files uploaded successfully to S3', {
          userId: data.userId,
          fileType: data.fileType,
          count: files.length,
        });

        return {
          files: uploadResults,
        };
      }

      // Handle single file
      const file = files[0];
      const fileExtension = path.extname(file.originalname);
      const key = `${data.userId}/${data.fileType}/${timestamp}${fileExtension}`;

      const result = await this.s3Service.uploadFile(
        key,
        file.buffer,
        file.mimetype,
      );

      logger.info('File uploaded successfully to S3', {
        userId: data.userId,
        fileType: data.fileType,
        fileKey: result.fileKey,
      });

      return {
        fileKey: result.fileKey,
        fileUrl: result.fileUrl,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to upload files to S3:', {
        error: err.message,
        stack: err.stack,
        userId: data.userId,
        fileType: data.fileType,
      });
      throw error;
    }
  }

  private validateFileTypes(
    files: Express.Multer.File[],
    fileType: string,
  ): void {
    const allowedMimeTypes: Record<string, string[]> = {
      image: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/tiff',
        'image/bmp',
      ],
      video: [
        'video/mp4',
        'video/webm',
        'video/x-msvideo',
        'video/quicktime',
        'video/x-ms-wmv',
        'video/x-flv',
        'video/3gpp',
      ],
      document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'application/rtf',
      ],
    };

    // Check if fileType is valid
    if (!allowedMimeTypes[fileType]) {
      throw new DatabaseValidationException(
        `Invalid file type: ${fileType}. Must be one of: image, video, document`,
      );
    }

    // Check if all files match the expected type
    for (const file of files) {
      if (!allowedMimeTypes[fileType].includes(file.mimetype)) {
        throw new DatabaseValidationException(
          `File type mismatch. Expected ${fileType} but got ${file.mimetype}. Allowed types for ${fileType} are: ${allowedMimeTypes[fileType].join(', ')}`,
        );
      }
    }

    // Check file size limits
    const maxSizes: Record<string, number> = {
      image: 10 * 1024 * 1024, // 10MB
      video: 100 * 1024 * 1024, // 100MB
      document: 50 * 1024 * 1024, // 50MB
    };

    for (const file of files) {
      if (file.size > maxSizes[fileType]) {
        throw new DatabaseValidationException(
          `File size exceeds the maximum allowed size for ${fileType}. Maximum size is ${maxSizes[fileType] / (1024 * 1024)}MB`,
        );
      }
    }
  }

  private mapToResponseDto(product: IProduct): ProductResponseDto {
    // Handle populated fields
    const categoryInfo = product.productCategoryId as unknown;
    const channelsInfo = product.channelIds as unknown;
    const createdByInfo = product.createdBy as unknown;

    let categoryId: string;
    let categoryName: string | undefined;
    if (
      categoryInfo &&
      typeof categoryInfo === 'object' &&
      '_id' in categoryInfo
    ) {
      const category = categoryInfo as { _id: string; categoryName?: string };
      categoryId = category._id.toString();
      categoryName = category.categoryName;
    } else {
      categoryId =
        product.productCategoryId instanceof Types.ObjectId
          ? product.productCategoryId.toString()
          : String(product.productCategoryId);
    }

    let channelIds: string[];
    let channelNames: string[] | undefined;
    if (
      Array.isArray(channelsInfo) &&
      channelsInfo.length > 0 &&
      typeof channelsInfo[0] === 'object' &&
      '_id' in channelsInfo[0]
    ) {
      const channels = channelsInfo as Array<{
        _id: string;
        channelName?: string;
      }>;
      channelIds = channels.map(c => c._id.toString());
      channelNames = channels
        .map(c => c.channelName)
        .filter(Boolean) as string[];
    } else {
      channelIds = product.channelIds.map(id =>
        id instanceof Types.ObjectId ? id.toString() : String(id),
      );
    }

    let createdById: string;
    let createdByName: string | undefined;
    if (
      createdByInfo &&
      typeof createdByInfo === 'object' &&
      '_id' in createdByInfo
    ) {
      const userInfo = createdByInfo as {
        _id: string;
        firstName?: string;
        lastName?: string;
      };
      createdById = userInfo._id.toString();
      createdByName =
        userInfo.firstName && userInfo.lastName
          ? `${userInfo.firstName} ${userInfo.lastName}`
          : undefined;
    } else {
      createdById =
        product.createdBy instanceof Types.ObjectId
          ? product.createdBy.toString()
          : String(product.createdBy);
    }

    // Map files with category names
    const files = product.files.map(file => {
      const fileCategoryInfo = file.categoryId as unknown;
      let categoryName: string | undefined;

      if (
        fileCategoryInfo &&
        typeof fileCategoryInfo === 'object' &&
        'categoryName' in fileCategoryInfo
      ) {
        const category = fileCategoryInfo as { categoryName: string };
        categoryName = category.categoryName;
      }

      return {
        _id: file._id?.toString() ?? '',
        categoryId:
          file.categoryId instanceof Types.ObjectId
            ? file.categoryId.toString()
            : String(file.categoryId),
        categoryName,
        fileType: file.fileType,
        language: file.language,
        brochureName: file.brochureName,
        s3Link: file.s3Link,
        uploadedAt: file.uploadedAt,
      };
    });

    return {
      _id: product._id.toString(),
      productCategoryId: categoryId,
      productCategoryName: categoryName,
      channelIds,
      channelNames,
      productName: product.productName,
      status: product.status,
      webLink: product.webLink,
      applicationId: product.applicationId,
      productDescription: product.productDescription,
      reasonsToBuy: product.reasonsToBuy,
      media: {
        videos: product.media.videos.map(video => ({
          _id: video._id?.toString() ?? '',
          title: video.title,
          s3Links: video.s3Links,
          youtubeUrl: video.youtubeUrl,
          isActive: video.isActive,
          uploadedAt: video.uploadedAt,
        })),
        images: product.media.images.map(image => ({
          _id: image._id?.toString() ?? '',
          title: image.title,
          s3Link: image.s3Link,
          isActive: image.isActive,
          uploadedAt: image.uploadedAt,
        })),
      },
      files,
      createdBy: createdById,
      createdByName,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
