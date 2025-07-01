import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateCommitmentCountDto } from '@/modules/business-commitment/dto/update-commitment-count.dto';

describe('UpdateCommitmentCountDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = plainToInstance(UpdateCommitmentCountDto, {
      additionalCount: 5,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate required fields', async () => {
    const dto = plainToInstance(UpdateCommitmentCountDto, {});
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'additionalCount')).toBe(true);
  });

  it('should validate minimum value', async () => {
    const invalidValues = [0, -1];

    for (const value of invalidValues) {
      const dto = plainToInstance(UpdateCommitmentCountDto, {
        additionalCount: value,
      });

      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'additionalCount')).toBe(true);
      expect(errors[0].constraints).toHaveProperty('min');
    }
  });

  it('should validate number type', async () => {
    const dto = plainToInstance(UpdateCommitmentCountDto, {
      additionalCount: 'not-a-number',
    });

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'additionalCount')).toBe(true);
    expect(errors[0].constraints).toHaveProperty('isNumber');
  });

  it('should allow valid positive numbers', async () => {
    const validValues = [1, 5, 10, 100];

    for (const value of validValues) {
      const dto = plainToInstance(UpdateCommitmentCountDto, {
        additionalCount: value,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });
});
