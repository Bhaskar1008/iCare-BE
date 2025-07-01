import { validate } from 'class-validator';
import { ModuleQueryDto } from '@/modules/module/dto/module-query.dto';

describe('ModuleQueryDto', () => {
  it('should validate a valid DTO with all fields', async () => {
    const dto = new ModuleQueryDto();
    dto.name = 'Test Module';
    dto.code = 'TEST_MODULE';
    dto.isActive = true;
    dto.isCore = false;
    dto.page = 1;
    dto.limit = 10;
    dto.sortBy = 'name';
    dto.sortOrder = 'asc';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate an empty DTO (all fields optional)', async () => {
    const dto = new ModuleQueryDto();
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate string fields', async () => {
    const dto = new ModuleQueryDto();
    dto.name = 123 as any; // Invalid type
    dto.code = 456 as any; // Invalid type

    const errors = await validate(dto);
    expect(errors).toHaveLength(2);
    expect(errors[0].property).toBe('name');
    expect(errors[1].property).toBe('code');
  });

  it('should validate boolean fields', async () => {
    const dto = new ModuleQueryDto();
    dto.isActive = 'true' as any; // Invalid type
    dto.isCore = 'false' as any; // Invalid type

    const errors = await validate(dto);
    expect(errors).toHaveLength(2);
    expect(errors[0].property).toBe('isActive');
    expect(errors[1].property).toBe('isCore');
  });

  it('should accept valid sortOrder values', async () => {
    const validOrders = ['asc', 'desc'];

    for (const order of validOrders) {
      const dto = new ModuleQueryDto();
      dto.sortOrder = order as 'asc' | 'desc';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });
});
