import { validate } from 'class-validator';
import { CreateModuleDto } from '@/modules/module/dto/create-module.dto';

describe('CreateModuleDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = new CreateModuleDto();
    dto.name = 'Test Module';
    dto.code = 'TEST_MODULE';
    dto.description = 'Test Description';
    dto.icon = 'test-icon';
    dto.defaultConfig = [
      {
        fieldName: 'testField',
        fieldType: 'string',
        values: ['value1', 'value2'],
      },
    ];
    dto.isActive = true;
    dto.isCore = false;
    dto.version = '1.0.0';
    dto.dependencies = ['dep1', 'dep2'];
    dto.permissions = ['perm1', 'perm2'];

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate required fields', async () => {
    const dto = new CreateModuleDto();
    const errors = await validate(dto);

    expect(errors).toHaveLength(3); // name and code are required
    const nameError = errors.find(e => e.property === 'name');
    const codeError = errors.find(e => e.property === 'code');
    expect(nameError).toBeDefined();
    expect(codeError).toBeDefined();
    expect(nameError?.constraints).toHaveProperty('isNotEmpty');
    expect(codeError?.constraints).toHaveProperty('isNotEmpty');
  });

  it('should validate code format', async () => {
    const dto = new CreateModuleDto();
    dto.name = 'Test Module';
    dto.code = 'invalid-code'; // Should only contain uppercase letters, numbers, and underscores

    const errors = await validate(dto);
    const codeErrors = errors.filter(e => e.property === 'code');
    expect(codeErrors).toHaveLength(1);
    expect(codeErrors[0].constraints).toHaveProperty(
      'matches',
      'Code can only contain uppercase letters, numbers, and underscores',
    );
  });

  it('should accept valid code formats', async () => {
    const validCodes = ['TEST_MODULE', 'TEST123', 'TEST_123_MODULE'];

    for (const code of validCodes) {
      const dto = new CreateModuleDto();
      dto.name = 'Test Module';
      dto.code = code;

      const errors = await validate(dto);
      expect(errors.filter(e => e.property === 'code')).toHaveLength(0);
    }
  });

  it('should validate optional arrays', async () => {
    const dto = new CreateModuleDto();
    dto.name = 'Test Module';
    dto.code = 'TEST_MODULE';
    dto.dependencies = ['dep1', 'dep2'];
    dto.permissions = ['perm1', 'perm2'];

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should validate defaultConfig structure', async () => {
    const dto = new CreateModuleDto();
    dto.name = 'Test Module';
    dto.code = 'TEST_MODULE';
    dto.defaultConfig = [
      {
        fieldName: 'testField',
        fieldType: 'string',
        values: ['value1', 'value2'],
      },
      {
        fieldName: 'testField2',
        fieldType: 'number',
        values: [1, 2, 3],
      },
    ];

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });
});
