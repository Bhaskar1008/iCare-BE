import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateProductDto,
  ReasonsToBuyDto,
  ProductVideoDto,
  ProductImageDto,
  ProductFileDto,
} from '@/modules/product/dto/create-product.dto';
import { VALIDATION } from '@/common/constants/http-status.constants';

describe('CreateProductDto', () => {
  const validProductData = {
    productCategoryId: '507f1f77bcf86cd799439011',
    channelIds: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
    productName: 'Test Product',
    status: 'active',
    webLink: 'https://example.com',
    applicationId: 'APP123',
    productDescription: 'Test Description',
    reasonsToBuy: {
      reason1: 'First Reason',
      reason2: 'Second Reason',
      reason3: 'Third Reason',
    },
    media: {
      videos: [
        {
          title: 'Test Video',
          s3Links: ['s3://test-video'],
          youtubeUrl: 'https://youtube.com/watch?v=test',
          isActive: true,
        },
      ],
      images: [
        {
          title: 'Test Image',
          s3Link: 's3://test-image',
          isActive: true,
        },
      ],
    },
    files: [
      {
        categoryId: '507f1f77bcf86cd799439014',
        fileType: 'PDF',
        language: 'English',
        brochureName: 'Test Brochure',
        s3Link: 's3://test-file',
      },
    ],
    createdBy: '507f1f77bcf86cd799439015',
  };

  it('should validate a valid DTO', async () => {
    const dto = plainToInstance(CreateProductDto, validProductData);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate required fields', async () => {
    const dto = plainToInstance(CreateProductDto, {});
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'productCategoryId')).toBe(true);
  });

  it('should validate MongoDB IDs', async () => {
    const invalidData = {
      ...validProductData,
      productCategoryId: 'invalid-id',
      channelIds: ['invalid-id'],
      createdBy: 'invalid-id',
    };

    const dto = plainToInstance(CreateProductDto, invalidData);
    const errors = await validate(dto);

    expect(errors.some(e => e.property === 'productCategoryId')).toBe(true);
    expect(errors.some(e => e.property === 'channelIds')).toBe(true);
    expect(errors.some(e => e.property === 'createdBy')).toBe(true);
  });

  it('should validate maximum lengths', async () => {
    const longString = 'a'.repeat(VALIDATION.MAX_NAME_LENGTH + 1);
    const invalidData = {
      ...validProductData,
      productName: longString,
      productDescription: 'a'.repeat(VALIDATION.MAX_DESCRIPTION_LENGTH + 1),
    };

    const dto = plainToInstance(CreateProductDto, invalidData);
    const errors = await validate(dto);

    expect(errors.some(e => e.property === 'productName')).toBe(true);
    expect(errors.some(e => e.property === 'productDescription')).toBe(true);
  });

  it('should validate status enum', async () => {
    const invalidData = {
      ...validProductData,
      status: 'invalid-status',
    };

    const dto = plainToInstance(CreateProductDto, invalidData);
    const errors = await validate(dto);

    expect(errors.some(e => e.property === 'status')).toBe(true);
  });

  it('should validate web link format', async () => {
    const invalidData = {
      ...validProductData,
      webLink: 'invalid-url',
    };

    const dto = plainToInstance(CreateProductDto, invalidData);
    const errors = await validate(dto);

    expect(errors.some(e => e.property === 'webLink')).toBe(true);
  });
});

describe('ReasonsToBuyDto', () => {
  it('should validate required reasons', async () => {
    const dto = plainToInstance(ReasonsToBuyDto, {});
    const errors = await validate(dto);

    expect(errors.some(e => e.property === 'reason1')).toBe(true);
    expect(errors.some(e => e.property === 'reason2')).toBe(true);
  });

  it('should validate reason lengths', async () => {
    const longReason = 'a'.repeat(301);
    const dto = plainToInstance(ReasonsToBuyDto, {
      reason1: longReason,
      reason2: longReason,
      reason3: longReason,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(3);
  });

  it('should allow optional reasons', async () => {
    const dto = plainToInstance(ReasonsToBuyDto, {
      reason1: 'First Reason',
      reason2: 'Second Reason',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

describe('ProductVideoDto', () => {
  it('should validate required fields', async () => {
    const dto = plainToInstance(ProductVideoDto, {});
    const errors = await validate(dto);

    expect(errors.some(e => e.property === 'title')).toBe(true);
  });

  it('should validate YouTube URL format', async () => {
    const dto = plainToInstance(ProductVideoDto, {
      title: 'Test Video',
      youtubeUrl: 'invalid-url',
    });

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'youtubeUrl')).toBe(true);
  });

  it('should validate s3Links array', async () => {
    const dto = plainToInstance(ProductVideoDto, {
      title: 'Test Video',
      s3Links: [123, 456], // Invalid types
    });

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 's3Links')).toBe(true);
  });
});

describe('ProductImageDto', () => {
  it('should validate required fields', async () => {
    const dto = plainToInstance(ProductImageDto, {});
    const errors = await validate(dto);

    expect(errors.some(e => e.property === 'title')).toBe(true);
    expect(errors.some(e => e.property === 's3Link')).toBe(true);
  });

  it('should validate title length', async () => {
    const dto = plainToInstance(ProductImageDto, {
      title: 'a'.repeat(101),
      s3Link: 's3://test',
    });

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'title')).toBe(true);
  });
});

describe('ProductFileDto', () => {
  it('should validate required fields', async () => {
    const dto = plainToInstance(ProductFileDto, {});
    const errors = await validate(dto);

    expect(errors.some(e => e.property === 'categoryId')).toBe(true);
    expect(errors.some(e => e.property === 'fileType')).toBe(true);
    expect(errors.some(e => e.property === 'language')).toBe(true);
    expect(errors.some(e => e.property === 'brochureName')).toBe(true);
    expect(errors.some(e => e.property === 's3Link')).toBe(true);
  });

  it('should validate file type enum', async () => {
    const dto = plainToInstance(ProductFileDto, {
      categoryId: '507f1f77bcf86cd799439011',
      fileType: 'INVALID',
      language: 'English',
      brochureName: 'Test',
      s3Link: 's3://test',
    });

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'fileType')).toBe(true);
  });

  it('should validate field lengths', async () => {
    const dto = plainToInstance(ProductFileDto, {
      categoryId: '507f1f77bcf86cd799439011',
      fileType: 'PDF',
      language: 'a'.repeat(51),
      brochureName: 'a'.repeat(101),
      s3Link: 's3://test',
    });

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'language')).toBe(true);
    expect(errors.some(e => e.property === 'brochureName')).toBe(true);
  });
});
