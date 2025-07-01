import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ProductQueryDto } from '@/modules/product/dto/product-query.dto';

describe('ProductQueryDto', () => {
  it('should validate an empty query DTO', async () => {
    const dto = plainToInstance(ProductQueryDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate valid query parameters', async () => {
    const dto = plainToInstance(ProductQueryDto, {
      page: '1',
      limit: '10',
      status: 'active',
      categoryId: '507f1f77bcf86cd799439011',
      channelId: '507f1f77bcf86cd799439012',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate status enum values', async () => {
    const dto = plainToInstance(ProductQueryDto, {
      status: 'invalid-status',
    });

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'status')).toBe(true);
    expect(errors[0].constraints).toHaveProperty('isIn');
  });

  it('should validate MongoDB ID formats', async () => {
    const dto = plainToInstance(ProductQueryDto, {
      categoryId: 'invalid-id',
      channelId: 'invalid-id',
    });

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'categoryId')).toBe(true);
    expect(errors.some(e => e.property === 'channelId')).toBe(true);
    expect(errors[0].constraints).toHaveProperty('isMongoId');
  });

  it('should allow valid MongoDB IDs', async () => {
    const dto = plainToInstance(ProductQueryDto, {
      categoryId: '507f1f77bcf86cd799439011',
      channelId: '507f1f77bcf86cd799439012',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should handle missing optional fields', async () => {
    const validCombinations = [
      { page: '1' },
      { limit: '10' },
      { status: 'active' },
      { categoryId: '507f1f77bcf86cd799439011' },
      { channelId: '507f1f77bcf86cd799439012' },
      { page: '1', limit: '10' },
      { categoryId: '507f1f77bcf86cd799439011', status: 'active' },
    ];

    for (const combination of validCombinations) {
      const dto = plainToInstance(ProductQueryDto, combination);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });
});
