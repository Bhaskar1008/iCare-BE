import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { FilterBusinessCommitmentDto } from '@/modules/business-commitment/dto/filter-business-commitment.dto';

describe('FilterBusinessCommitmentDto', () => {
  const validData = {
    agentId: '507f1f77bcf86cd799439011',
    fromDate: new Date('2024-01-01'),
    toDate: new Date('2024-12-31'),
  };

  it('should validate a valid DTO', async () => {
    const dto = plainToInstance(FilterBusinessCommitmentDto, validData);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should allow empty DTO', async () => {
    const dto = plainToInstance(FilterBusinessCommitmentDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate MongoDB ID format when agentId is provided', async () => {
    const invalidData = {
      agentId: 'invalid-id',
    };

    const dto = plainToInstance(FilterBusinessCommitmentDto, invalidData);
    const errors = await validate(dto);

    expect(errors.some(e => e.property === 'agentId')).toBe(true);
    expect(errors[0].constraints).toHaveProperty('isMongoId');
  });

  it('should validate date format when dates are provided', async () => {
    const invalidData = {
      fromDate: 'invalid-date',
      toDate: 'invalid-date',
    };

    const dto = plainToInstance(FilterBusinessCommitmentDto, invalidData);
    const errors = await validate(dto);

    expect(errors.some(e => e.property === 'fromDate')).toBe(true);
    expect(errors.some(e => e.property === 'toDate')).toBe(true);
    expect(errors[0].constraints).toHaveProperty('isDate');
  });

  it('should allow partial filters', async () => {
    const validCombinations = [
      { agentId: '507f1f77bcf86cd799439011' },
      { fromDate: new Date() },
      { toDate: new Date() },
      { fromDate: new Date(), toDate: new Date() },
    ];

    for (const combination of validCombinations) {
      const dto = plainToInstance(FilterBusinessCommitmentDto, combination);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });
});
