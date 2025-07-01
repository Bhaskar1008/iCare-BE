import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ModuleConfigQueryDto } from '@/modules/module-config/dto/module-config-query.dto';

describe('ModuleConfigQueryDto', () => {
  it('should validate an empty query DTO', async () => {
    const dto = new ModuleConfigQueryDto();
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate a valid query DTO with all fields', async () => {
    const dto = new ModuleConfigQueryDto();
    dto.moduleId = '507f1f77bcf86cd799439011';
    dto.projectId = '507f1f77bcf86cd799439012';
    dto.configName = 'Test Config';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate moduleId format when provided', async () => {
    const dto = new ModuleConfigQueryDto();
    dto.moduleId = 'invalid-id';

    const errors = await validate(dto);
    const moduleIdErrors = errors.find(e => e.property === 'moduleId');
    expect(moduleIdErrors).toBeDefined();
    expect(moduleIdErrors?.constraints).toHaveProperty('isMongoId');
  });

  it('should validate projectId format when provided', async () => {
    const dto = new ModuleConfigQueryDto();
    dto.projectId = 'invalid-id';

    const errors = await validate(dto);
    const projectIdErrors = errors.find(e => e.property === 'projectId');
    expect(projectIdErrors).toBeDefined();
    expect(projectIdErrors?.constraints).toHaveProperty('isMongoId');
  });

  it('should trim configName when provided', async () => {
    const plainObject = {
      configName: '  Test Config  ',
    };

    const dto = plainToInstance(ModuleConfigQueryDto, plainObject);
    expect(dto.configName).toBe('Test Config');
  });

  it('should handle non-string configName gracefully', async () => {
    const plainObject = {
      configName: 123,
    };

    const dto = plainToInstance(ModuleConfigQueryDto, plainObject);
    const errors = await validate(dto);
    const configNameErrors = errors.find(e => e.property === 'configName');
    expect(configNameErrors).toBeDefined();
    expect(configNameErrors?.constraints).toHaveProperty('isString');
  });
});
