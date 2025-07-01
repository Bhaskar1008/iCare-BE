import { validate } from 'class-validator';
import {
  CreateModuleConfigDto,
  ConfigFieldDto,
  ConfigValueDto,
} from '@/modules/module-config/dto/create-module-config.dto';

describe('CreateModuleConfigDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = new CreateModuleConfigDto();
    dto.moduleId = '507f1f77bcf86cd799439011';
    dto.projectId = '507f1f77bcf86cd799439012';
    dto.configName = 'Test Config';
    dto.description = 'Test Description';
    dto.fields = [
      {
        fieldName: 'testField',
        fieldType: 'string',
        description: 'Test Field Description',
        values: [
          {
            key: 'test_key',
            value: 'test_value',
            displayName: 'Test Display',
            dependentValues: ['dep1', 'dep2'],
          },
        ],
      },
    ];
    dto.metadata = { key: 'value' };

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should validate required fields', async () => {
    const dto = new CreateModuleConfigDto();
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const moduleIdError = errors.find(e => e.property === 'moduleId');
    const configNameError = errors.find(e => e.property === 'configName');
    const fieldsError = errors.find(e => e.property === 'fields');

    expect(moduleIdError).toBeDefined();
    expect(configNameError).toBeDefined();
    expect(fieldsError).toBeDefined();
  });

  it('should validate moduleId format', async () => {
    const dto = new CreateModuleConfigDto();
    dto.moduleId = 'invalid-id';
    dto.configName = 'Test Config';
    dto.fields = [];

    const errors = await validate(dto);
    const moduleIdErrors = errors.find(e => e.property === 'moduleId');
    expect(moduleIdErrors).toBeDefined();
    expect(moduleIdErrors?.constraints).toHaveProperty('isMongoId');
  });

  it('should validate optional projectId format when provided', async () => {
    const dto = new CreateModuleConfigDto();
    dto.moduleId = '507f1f77bcf86cd799439011';
    dto.projectId = 'invalid-id';
    dto.configName = 'Test Config';
    dto.fields = [];

    const errors = await validate(dto);
    const projectIdErrors = errors.find(e => e.property === 'projectId');
    expect(projectIdErrors).toBeDefined();
    expect(projectIdErrors?.constraints).toHaveProperty('isMongoId');
  });
});

describe('ConfigFieldDto', () => {
  it('should validate a valid field DTO', async () => {
    const dto = new ConfigFieldDto();
    dto.fieldName = 'testField';
    dto.fieldType = 'string';
    dto.description = 'Test Description';
    dto.values = [
      {
        key: 'test_key',
        value: 'test_value',
      },
    ];

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should validate required fields', async () => {
    const dto = new ConfigFieldDto();
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const fieldNameError = errors.find(e => e.property === 'fieldName');
    const fieldTypeError = errors.find(e => e.property === 'fieldType');
    const valuesError = errors.find(e => e.property === 'values');

    expect(fieldNameError).toBeDefined();
    expect(fieldTypeError).toBeDefined();
    expect(valuesError).toBeDefined();
  });
});

describe('ConfigValueDto', () => {
  it('should validate a valid value DTO', async () => {
    const dto = new ConfigValueDto();
    dto.key = 'test_key';
    dto.value = 'test_value';
    dto.displayName = 'Test Display';
    dto.dependentValues = ['dep1', 'dep2'];

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate required fields', async () => {
    const dto = new ConfigValueDto();
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const keyError = errors.find(e => e.property === 'key');
    const valueError = errors.find(e => e.property === 'value');

    expect(keyError).toBeDefined();
    expect(valueError).toBeDefined();
  });

  it('should validate optional fields can be undefined', async () => {
    const dto = new ConfigValueDto();
    dto.key = 'test_key';
    dto.value = 'test_value';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate dependentValues array type', async () => {
    const dto = new ConfigValueDto();
    dto.key = 'test_key';
    dto.value = 'test_value';
    dto.dependentValues = ['valid', 123] as any; // Testing invalid type

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const dependentValuesError = errors.find(
      e => e.property === 'dependentValues',
    );
    expect(dependentValuesError).toBeDefined();
  });
});
