import type {
  ModuleConfigResponseDto,
  ConfigFieldResponseDto,
  ConfigValueResponseDto,
} from '@/modules/module-config/dto/module-config-response.dto';

describe('ModuleConfigResponseDto', () => {
  it('should create a valid response DTO', () => {
    const response: ModuleConfigResponseDto = {
      _id: '507f1f77bcf86cd799439011',
      moduleId: '507f1f77bcf86cd799439012',
      moduleName: 'Test Module',
      projectId: '507f1f77bcf86cd799439013',
      projectName: 'Test Project',
      configName: 'Test Config',
      description: 'Test Description',
      fields: [
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
      ],
      metadata: { key: 'value' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Type checking assertions
    expect(response._id).toBeDefined();
    expect(typeof response._id).toBe('string');
    expect(typeof response.moduleId).toBe('string');
    expect(typeof response.configName).toBe('string');
    expect(Array.isArray(response.fields)).toBe(true);
    expect(response.createdAt instanceof Date).toBe(true);
    expect(response.updatedAt instanceof Date).toBe(true);
  });
});

describe('ConfigFieldResponseDto', () => {
  it('should create a valid field response DTO', () => {
    const field: ConfigFieldResponseDto = {
      fieldName: 'testField',
      fieldType: 'string',
      description: 'Test Description',
      values: [
        {
          key: 'test_key',
          value: 'test_value',
          displayName: 'Test Display',
          dependentValues: ['dep1', 'dep2'],
        },
      ],
    };

    // Type checking assertions
    expect(typeof field.fieldName).toBe('string');
    expect(typeof field.fieldType).toBe('string');
    expect(typeof field.description).toBe('string');
    expect(Array.isArray(field.values)).toBe(true);
  });

  it('should allow optional description', () => {
    const field: ConfigFieldResponseDto = {
      fieldName: 'testField',
      fieldType: 'string',
      values: [],
    };

    expect(field.description).toBeUndefined();
  });
});

describe('ConfigValueResponseDto', () => {
  it('should create a valid value response DTO', () => {
    const value: ConfigValueResponseDto = {
      key: 'test_key',
      value: 'test_value',
      displayName: 'Test Display',
      dependentValues: ['dep1', 'dep2'],
    };

    // Type checking assertions
    expect(typeof value.key).toBe('string');
    expect(typeof value.value).toBe('string');
    expect(typeof value.displayName).toBe('string');
    expect(Array.isArray(value.dependentValues)).toBe(true);
  });

  it('should allow optional fields', () => {
    const value: ConfigValueResponseDto = {
      key: 'test_key',
      value: 'test_value',
    };

    expect(value.displayName).toBeUndefined();
    expect(value.dependentValues).toBeUndefined();
  });
});
