import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateProjectDto } from '@/modules/project/dto/create-project.dto';

describe('CreateProjectDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      projectName: 'Test Project',
      projectCode: 'TEST_PROJECT',
      description: 'Test Description',
      modules: [
        {
          moduleId: '507f1f77bcf86cd799439011',
          isActive: true,
          config: { key: 'value' },
        },
      ],
      projectStatus: 'active',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate required fields', async () => {
    const dto = plainToInstance(CreateProjectDto, {});
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const projectNameError = errors.find(e => e.property === 'projectName');
    const projectCodeError = errors.find(e => e.property === 'projectCode');
    const modulesError = errors.find(e => e.property === 'modules');

    expect(projectNameError).toBeDefined();
    expect(projectCodeError).toBeDefined();
    expect(modulesError).toBeDefined();
  });

  it('should validate modules array minimum size', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      projectName: 'Test Project',
      projectCode: 'TEST_PROJECT',
      modules: [],
    });

    const errors = await validate(dto);
    const modulesError = errors.find(e => e.property === 'modules');
    expect(modulesError).toBeDefined();
    expect(modulesError?.constraints).toHaveProperty('arrayMinSize');
  });

  it('should validate module config structure', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      projectName: 'Test Project',
      projectCode: 'TEST_PROJECT',
      modules: [
        {
          moduleId: 'invalid-id', // Invalid MongoDB ID
          isActive: true,
          config: { key: 'value' },
        },
      ],
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const moduleError = errors.find(e => e.property === 'modules');
    expect(moduleError).toBeDefined();
  });

  it('should validate project status enum', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      projectName: 'Test Project',
      projectCode: 'TEST_PROJECT',
      modules: [
        {
          moduleId: '507f1f77bcf86cd799439011',
          isActive: true,
        },
      ],
      projectStatus: 'invalid',
    });

    const errors = await validate(dto);
    const statusError = errors.find(e => e.property === 'projectStatus');
    expect(statusError).toBeDefined();
    expect(statusError?.constraints).toHaveProperty('isEnum');
  });

  it('should validate optional fields can be undefined', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      projectName: 'Test Project',
      projectCode: 'TEST_PROJECT',
      modules: [
        {
          moduleId: '507f1f77bcf86cd799439011',
        },
      ],
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
