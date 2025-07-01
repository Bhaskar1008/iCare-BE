import type {
  ProductResponseDto,
  ProductVideoResponseDto,
  ProductImageResponseDto,
  ProductFileResponseDto,
  ProductMediaResponseDto,
  ReasonsToBuyResponseDto,
} from '@/modules/product/dto/product-response.dto';

describe('ProductResponseDto', () => {
  const mockDate = new Date();

  const mockVideo: ProductVideoResponseDto = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Test Video',
    s3Links: ['s3://test-video'],
    youtubeUrl: 'https://youtube.com/watch?v=test',
    isActive: true,
    uploadedAt: mockDate,
  };

  const mockImage: ProductImageResponseDto = {
    _id: '507f1f77bcf86cd799439012',
    title: 'Test Image',
    s3Link: 's3://test-image',
    isActive: true,
    uploadedAt: mockDate,
  };

  const mockFile: ProductFileResponseDto = {
    _id: '507f1f77bcf86cd799439013',
    categoryId: '507f1f77bcf86cd799439014',
    categoryName: 'Test Category',
    fileType: 'PDF',
    language: 'English',
    brochureName: 'Test Brochure',
    s3Link: 's3://test-file',
    uploadedAt: mockDate,
  };

  const mockMedia: ProductMediaResponseDto = {
    videos: [mockVideo],
    images: [mockImage],
  };

  const mockReasonsToBuy: ReasonsToBuyResponseDto = {
    reason1: 'First Reason',
    reason2: 'Second Reason',
    reason3: 'Third Reason',
  };

  const mockProduct: ProductResponseDto = {
    _id: '507f1f77bcf86cd799439015',
    productCategoryId: '507f1f77bcf86cd799439016',
    productCategoryName: 'Test Category',
    channelIds: ['507f1f77bcf86cd799439017'],
    channelNames: ['Test Channel'],
    productName: 'Test Product',
    status: 'active',
    webLink: 'https://example.com',
    applicationId: 'APP123',
    productDescription: 'Test Description',
    reasonsToBuy: mockReasonsToBuy,
    media: mockMedia,
    files: [mockFile],
    createdBy: '507f1f77bcf86cd799439018',
    createdByName: 'Test User',
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  it('should validate product response structure', () => {
    expect(mockProduct._id).toBeDefined();
    expect(typeof mockProduct._id).toBe('string');
    expect(typeof mockProduct.productName).toBe('string');
    expect(['active', 'inactive']).toContain(mockProduct.status);
    expect(mockProduct.createdAt instanceof Date).toBe(true);
    expect(mockProduct.updatedAt instanceof Date).toBe(true);
  });

  it('should validate media response structure', () => {
    const { media } = mockProduct;
    expect(Array.isArray(media.videos)).toBe(true);
    expect(Array.isArray(media.images)).toBe(true);

    const video = media.videos[0];
    expect(typeof video._id).toBe('string');
    expect(typeof video.title).toBe('string');
    expect(Array.isArray(video.s3Links)).toBe(true);
    expect(typeof video.isActive).toBe('boolean');
    expect(video.uploadedAt instanceof Date).toBe(true);

    const image = media.images[0];
    expect(typeof image._id).toBe('string');
    expect(typeof image.title).toBe('string');
    expect(typeof image.s3Link).toBe('string');
    expect(typeof image.isActive).toBe('boolean');
    expect(image.uploadedAt instanceof Date).toBe(true);
  });

  it('should validate file response structure', () => {
    const file = mockProduct.files[0];
    expect(typeof file._id).toBe('string');
    expect(typeof file.categoryId).toBe('string');
    expect(['PDF', 'PPT']).toContain(file.fileType);
    expect(typeof file.language).toBe('string');
    expect(typeof file.brochureName).toBe('string');
    expect(typeof file.s3Link).toBe('string');
    expect(file.uploadedAt instanceof Date).toBe(true);
  });

  it('should validate reasons to buy structure', () => {
    const { reasonsToBuy } = mockProduct;
    expect(typeof reasonsToBuy.reason1).toBe('string');
    expect(typeof reasonsToBuy.reason2).toBe('string');
    expect(typeof reasonsToBuy.reason3).toBe('string');
    expect(reasonsToBuy.reason4).toBeUndefined();
    expect(reasonsToBuy.reason5).toBeUndefined();
  });

  it('should handle optional fields', () => {
    const minimalProduct: ProductResponseDto = {
      _id: '507f1f77bcf86cd799439015',
      productCategoryId: '507f1f77bcf86cd799439016',
      channelIds: [],
      productName: 'Test Product',
      status: 'active',
      reasonsToBuy: {
        reason1: 'First Reason',
        reason2: 'Second Reason',
      },
      media: {
        videos: [],
        images: [],
      },
      files: [],
      createdBy: '507f1f77bcf86cd799439018',
      createdAt: mockDate,
      updatedAt: mockDate,
    };

    expect(minimalProduct.webLink).toBeUndefined();
    expect(minimalProduct.applicationId).toBeUndefined();
    expect(minimalProduct.productDescription).toBeUndefined();
    expect(minimalProduct.productCategoryName).toBeUndefined();
    expect(minimalProduct.channelNames).toBeUndefined();
    expect(minimalProduct.createdByName).toBeUndefined();
  });
});
