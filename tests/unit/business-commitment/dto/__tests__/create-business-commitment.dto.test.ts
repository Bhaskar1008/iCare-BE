import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateBusinessCommitmentDto } from '@/modules/business-commitment/dto/create-business-commitment.dto';

describe('CreateBusinessCommitmentDto', () => {
  const validData = {
    agentId: '507f1f77bcf86cd799439011',
    commitmentDate: new Date(),
    commitmentCount: 10,
    createdBy: '507f1f77bcf86cd799439012',
  };

  it('should validate a valid DTO', async () => {
    const dto = plainToInstance(CreateBusinessCommitmentDto, validData);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate required fields', async () => {
    const dto = plainToInstance(CreateBusinessCommitmentDto, {});
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.property === 'agentId')).toBe(true);
    expect(errors.some(e => e.property === 'commitmentDate')).toBe(true);
    expect(errors.some(e => e.property === 'commitmentCount')).toBe(true);
    expect(errors.some(e => e.property === 'createdBy')).toBe(true);
  });

  it('should validate MongoDB IDs', async () => {
    const invalidData = {
      ...validData,
      agentId: 'invalid-id',
      createdBy: 'invalid-id',
    };

    const dto = plainToInstance(CreateBusinessCommitmentDto, invalidData);
    const errors = await validate(dto);

    expect(errors.some(e => e.property === 'agentId')).toBe(true);
    expect(errors.some(e => e.property === 'createdBy')).toBe(true);
  });

  it('should validate commitment count minimum value', async () => {
    const invalidData = {
      ...validData,
      commitmentCount: -1,
    };

    const dto = plainToInstance(CreateBusinessCommitmentDto, invalidData);
    const errors = await validate(dto);

    expect(errors.some(e => e.property === 'commitmentCount')).toBe(true);
    expect(errors[0].constraints).toHaveProperty('min');
  });

  it('should validate commitment date type', async () => {
    const invalidData = {
      ...validData,
      commitmentDate: 'invalid-date',
    };

    const dto = plainToInstance(CreateBusinessCommitmentDto, invalidData);
    const errors = await validate(dto);

    expect(errors.some(e => e.property === 'commitmentDate')).toBe(true);
    expect(errors[0].constraints).toHaveProperty('isDate');
  });
});
