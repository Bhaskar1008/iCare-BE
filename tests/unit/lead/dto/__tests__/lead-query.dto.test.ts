import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  LeadQueryDto,
  LeadCreatorQueryDto,
} from '@/modules/lead/dto/lead-query.dto';

describe('LeadQueryDto', () => {
  it('should validate an empty query DTO', async () => {
    const dto = plainToInstance(LeadQueryDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate valid query parameters', async () => {
    const dto = plainToInstance(LeadQueryDto, {
      page: '1',
      limit: '10',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should use default values when not provided', async () => {
    const dto = plainToInstance(LeadQueryDto, {});
    expect(dto.page).toBe('1');
    expect(dto.limit).toBe('10');
  });
});

describe('LeadCreatorQueryDto', () => {
  it('should inherit validation from LeadQueryDto', async () => {
    const dto = plainToInstance(LeadCreatorQueryDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate query parameters like parent class', async () => {
    const dto = plainToInstance(LeadCreatorQueryDto, {
      page: '2',
      limit: '20',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should use default values like parent class', async () => {
    const dto = plainToInstance(LeadCreatorQueryDto, {});
    expect(dto.page).toBe('1');
    expect(dto.limit).toBe('10');
  });
});
