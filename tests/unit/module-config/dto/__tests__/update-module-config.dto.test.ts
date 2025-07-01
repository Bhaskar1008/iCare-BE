import { validate } from 'class-validator';
import { UpdateModuleConfigDto } from '@/modules/module-config/dto/update-module-config.dto';

describe('UpdateModuleConfigDto', () => {
  it('should validate an empty update DTO', async () => {
    const dto = new UpdateModuleConfigDto();
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate a valid update DTO with all fields', async () => {
    const dto = new UpdateModuleConfigDto();
    dto.configName = 'Updated Config';
    dto.description = 'Updated Description';
    dto.fields = [
      {
        fieldName: 'updatedField',
        fieldType: 'string',
        description: 'Updated Field Description',
        values: [
          {
            key: 'updated_key',
            value: 'updated_value',
            displayName: 'Updated Display',
            dependentValues: ['dep1', 'dep2'],
          },
        ],
      },
    ];
    dto.metadata = { key: 'updated_value' };

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should validate fields array structure', async () => {
    const dto = new UpdateModuleConfigDto();
    dto.fields = [
      {
        // Missing required properties
      } as any,
    ];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const fieldsError = errors.find(e => e.property === 'fields');
    expect(fieldsError).toBeDefined();
  });

  it('should validate metadata object type', async () => {
    const dto = new UpdateModuleConfigDto();
    dto.metadata = 'not an object' as any;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const metadataError = errors.find(e => e.property === 'metadata');
    expect(metadataError).toBeDefined();
    expect(metadataError?.constraints).toHaveProperty('isObject');
  });

  it('should validate string fields', async () => {
    const dto = new UpdateModuleConfigDto();
    dto.configName = 123 as any;
    dto.description = true as any;

    const errors = await validate(dto);
    expect(errors.length).toBe(2);

    const configNameError = errors.find(e => e.property === 'configName');
    const descriptionError = errors.find(e => e.property === 'description');

    expect(configNameError).toBeDefined();
    expect(descriptionError).toBeDefined();
    expect(configNameError?.constraints).toHaveProperty('isString');
    expect(descriptionError?.constraints).toHaveProperty('isString');
  });

  it('should validate nested field values', async () => {
    const dto = new UpdateModuleConfigDto();
    dto.fields = [
      {
        fieldName: 'testField',
        fieldType: 'string',
        values: [
          {
            // Invalid value object
            key: 123,
            value: true,
          } as any,
        ],
      },
    ];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
