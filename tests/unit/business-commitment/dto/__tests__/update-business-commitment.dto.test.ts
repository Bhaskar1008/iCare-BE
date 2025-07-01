import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateBusinessCommitmentDto } from '@/modules/business-commitment/dto/update-business-commitment.dto';

describe('UpdateBusinessCommitmentDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = plainToInstance(UpdateBusinessCommitmentDto, {
      achievedCount: 5,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate required fields', async () => {
    const dto = plainToInstance(UpdateBusinessCommitmentDto, {});
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'achievedCount')).toBe(true);
  });

  it('should validate minimum value', async () => {
    const dto = plainToInstance(UpdateBusinessCommitmentDto, {
      achievedCount: -1,
    });

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'achievedCount')).toBe(true);
    expect(errors[0].constraints).toHaveProperty('min');
  });

  it('should validate number type', async () => {
    const dto = plainToInstance(UpdateBusinessCommitmentDto, {
      achievedCount: 'not-a-number',
    });

    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'achievedCount')).toBe(true);
    expect(errors[0].constraints).toHaveProperty('isNumber');
  });

  it('should allow zero value', async () => {
    const dto = plainToInstance(UpdateBusinessCommitmentDto, {
      achievedCount: 0,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
