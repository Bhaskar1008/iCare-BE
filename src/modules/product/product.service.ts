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

  constructor() {
    this.productRepository = new ProductRepository();
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
            isActive: video.isActive,
            uploadedAt: new Date(),
          })) ?? [],
        images:
          data.media?.images?.map(image => ({
            title: image.title,
            s3Link: image.s3Link,
            isActive: image.isActive,
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
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    status?: 'active' | 'inactive',
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

      const query: FilterQuery<IProduct> = { isDeleted: false };

      if (status) {
        query.status = status;
      }
      if (categoryId) {
        query.productCategoryId = new Types.ObjectId(categoryId);
      }
      if (channelId) {
        query.channelIds = new Types.ObjectId(channelId);
      }

      const [products, total] = await Promise.all([
        this.productRepository
          .find(query)
          .skip((page - 1) * limit)
          .limit(limit)
          .exec(),
        this.productRepository.countDocuments(query),
      ]);

      const mappedProducts = products.map((product: IProduct) =>
        this.mapToResponseDto(product),
      );

      logger.debug('Products retrieved successfully', {
        count: products.length,
        total,
      });

      return {
        products: mappedProducts,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
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
      const updatedProduct = await this.productRepository.updateById(id, {
        isDeleted: true,
        deletedAt: new Date(),
      });

      logger.info('Product deleted successfully', {
        id,
        deleted: !!updatedProduct,
      });
      return !!updatedProduct;
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
      logger.debug('Uploading files to S3', { data });

      // Validate user exists
      const user = await UserModel.findById(data.userId);

      if (!user || user.isDeleted) {
        throw new DatabaseValidationException('User not found or deleted');
      }

      const s3Service = new S3Service();
      const timestamp = Date.now();

      // Handle multiple files
      if (data.isMultiple && files.length > 1) {
        const uploadPromises = files.map((file, index) => {
          const fileExtension = path.extname(file.originalname);
          const key = `${data.userId}/${data.fileType}/${timestamp}_${index}${fileExtension}`;
          return s3Service.uploadFile(key, file.buffer, file.mimetype);
        });

        const results = await Promise.all(uploadPromises);

        return {
          files: results,
        };
      }

      // Handle single file
      const file = files[0];
      const fileExtension = path.extname(file.originalname);
      const key = `${data.userId}/${data.fileType}/${timestamp}${fileExtension}`;

      const result = await s3Service.uploadFile(key, file.buffer, file.mimetype);

      return {
        fileKey: result.fileKey,
        fileUrl: result.fileUrl,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to upload files to S3:', {
        error: err.message,
        stack: err.stack,
        data,
      });
      throw error;
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
      categoryId = category._id;
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
      channelIds = channels.map(c => c._id);
      channelNames = channels
        .map(c => c.channelName)
        .filter(Boolean) as string[];
    } else {
      channelIds = product.channelIds.map(id => id.toString());
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
      createdById = userInfo._id;
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
      _id: product._id,
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
