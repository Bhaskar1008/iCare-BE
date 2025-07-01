import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ProjectQueryDto } from '@/modules/project/dto/project-query.dto';
import { PAGINATION } from '@/common/constants/http-status.constants';

describe('ProjectQueryDto', () => {
  it('should validate an empty query DTO', async () => {
    const dto = new ProjectQueryDto();
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate a valid query DTO with all fields', async () => {
    const dto = new ProjectQueryDto();
    dto.projectName = 'Test Project';
    dto.projectCode = 'TEST_PROJECT';
    dto.projectStatus = 'active';
    dto.page = 1;
    dto.limit = 10;
    dto.sortBy = 'projectName';
    dto.sortOrder = 'asc';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate project status enum', async () => {
    const dto = new ProjectQueryDto();
    dto.projectStatus = 'invalid' as any;

    const errors = await validate(dto);
    const statusError = errors.find(e => e.property === 'projectStatus');
    expect(statusError).toBeDefined();
    expect(statusError?.constraints).toHaveProperty('isEnum');
  });

  it('should validate page and limit as numbers', async () => {
    const plainObject = {
      page: '2',
      limit: '20',
    };

    const dto = plainToInstance(ProjectQueryDto, plainObject);
    expect(typeof dto.page).toBe('number');
    expect(typeof dto.limit).toBe('number');
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(20);
  });

  it('should validate minimum values for page and limit', async () => {
    const dto = new ProjectQueryDto();
    dto.page = 0;
    dto.limit = 0;

    const errors = await validate(dto);
    const pageError = errors.find(e => e.property === 'page');
    const limitError = errors.find(e => e.property === 'limit');

    expect(pageError).toBeDefined();
    expect(limitError).toBeDefined();
    expect(pageError?.constraints).toHaveProperty('min');
    expect(limitError?.constraints).toHaveProperty('min');
  });

  it('should validate sortBy field values', async () => {
    const dto = new ProjectQueryDto();
    dto.sortBy = 'invalidField';

    const errors = await validate(dto);
    const sortByError = errors.find(e => e.property === 'sortBy');
    expect(sortByError).toBeDefined();
    expect(sortByError?.constraints).toHaveProperty('isIn');
  });

  it('should validate sortOrder field values', async () => {
    const dto = new ProjectQueryDto();
    dto.sortOrder = 'invalid' as any;

    const errors = await validate(dto);
    const sortOrderError = errors.find(e => e.property === 'sortOrder');
    expect(sortOrderError).toBeDefined();
    expect(sortOrderError?.constraints).toHaveProperty('isIn');
  });

  it('should use default values when not provided', async () => {
    const dto = new ProjectQueryDto();
    expect(dto.page).toBe(PAGINATION.DEFAULT_PAGE);
    expect(dto.limit).toBe(PAGINATION.DEFAULT_LIMIT);
    expect(dto.sortBy).toBe('createdAt');
    expect(dto.sortOrder).toBe('desc');
  });
});
