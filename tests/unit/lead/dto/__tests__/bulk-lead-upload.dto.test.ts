import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BulkLeadUploadDto } from '@/modules/lead/dto/bulk-lead-upload.dto';

describe('BulkLeadUploadDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = plainToInstance(BulkLeadUploadDto, {
      projectId: '507f1f77bcf86cd799439011',
      batchSize: 100,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate required fields', async () => {
    const dto = plainToInstance(BulkLeadUploadDto, {});
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'projectId')).toBe(true);
  });

  it('should validate MongoDB ID format', async () => {
    const dto = plainToInstance(BulkLeadUploadDto, {
      projectId: 'invalid-id',
      batchSize: 100,
    });

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'projectId')).toBe(true);
    expect(errors[0].constraints).toHaveProperty('isMongoId');
  });

  it('should validate batch size minimum value', async () => {
    const dto = plainToInstance(BulkLeadUploadDto, {
      projectId: '507f1f77bcf86cd799439011',
      batchSize: 0,
    });

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'batchSize')).toBe(true);
    expect(errors[0].constraints).toHaveProperty('min');
  });

  it('should validate batch size maximum value', async () => {
    const dto = plainToInstance(BulkLeadUploadDto, {
      projectId: '507f1f77bcf86cd799439011',
      batchSize: 501,
    });

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'batchSize')).toBe(true);
    expect(errors[0].constraints).toHaveProperty('max');
  });

  it('should validate batch size is integer', async () => {
    const dto = plainToInstance(BulkLeadUploadDto, {
      projectId: '507f1f77bcf86cd799439011',
      batchSize: 1.5,
    });

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'batchSize')).toBe(true);
    expect(errors[0].constraints).toHaveProperty('isInt');
  });

  it('should allow valid batch size values', async () => {
    const validValues = [1, 100, 250, 500];

    for (const value of validValues) {
      const dto = plainToInstance(BulkLeadUploadDto, {
        projectId: '507f1f77bcf86cd799439011',
        batchSize: value,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });

  it('should allow missing optional batch size', async () => {
    const dto = plainToInstance(BulkLeadUploadDto, {
      projectId: '507f1f77bcf86cd799439011',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
