import { ProjectResponseDto } from '@/modules/project/dto/project-response.dto';
import { Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import type { IProject } from '@/models/project.model';
import type { IModule } from '@/models/module.model';

function createMockModule(
  data: Partial<IModule> = {},
): HydratedDocument<IModule> {
  const mockModule = {
    _id: data._id || new Types.ObjectId(),
    name: data.name || 'Test Module',
    code: data.code || 'TEST_MOD',
    description: data.description,
    version: data.version || '1.0.0',
    isCore: data.isCore || false,
    permissions: data.permissions || ['read', 'write'],
    accessControl: data.accessControl || true,
    defaultConfig: data.defaultConfig || [],
    isActive: data.isActive || true,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    isDeleted: data.isDeleted || false,
    deletedAt: data.deletedAt || null,
    $assertPopulated: jest.fn(),
    $clearModifiedPaths: jest.fn(),
    $clone: jest.fn(),
    $createModifiedPathsSnapshot: jest.fn(),
    $getAllSubdocs: jest.fn(),
    $ignore: jest.fn(),
    $isDefault: jest.fn(),
    $isDeleted: jest.fn(),
    $getPopulatedDocs: jest.fn(),
    $inc: jest.fn(),
    $isEmpty: jest.fn(),
    $isValid: jest.fn(),
    $locals: {},
    $markValid: jest.fn(),
    $model: jest.fn(),
    $op: null,
    $parent: null,
    $restoreModifiedPathsSnapshot: jest.fn(),
    $session: jest.fn(),
    $set: jest.fn(),
    $where: {},
    baseModelName: undefined,
    collection: {} as any,
    db: {} as any,
    delete: jest.fn(),
    deleteOne: jest.fn(),
    depopulate: jest.fn(),
    directModifiedPaths: jest.fn(),
    equals: jest.fn(),
    errors: {},
    get: jest.fn(),
    getChanges: jest.fn(),
    increment: jest.fn(),
    init: jest.fn(),
    invalidate: jest.fn(),
    isDirectModified: jest.fn(),
    isDirectSelected: jest.fn(),
    isInit: jest.fn(),
    isModified: jest.fn(),
    isNew: false,
    isSelected: jest.fn(),
    markModified: jest.fn(),
    model: jest.fn(),
    modifiedPaths: jest.fn(),
    modelName: '',
    overwrite: jest.fn(),
    populate: jest.fn(),
    populated: jest.fn(),
    remove: jest.fn(),
    replaceOne: jest.fn(),
    save: jest.fn(),
    schema: {} as any,
    set: jest.fn(),
    toJSON: jest.fn(),
    toObject: jest.fn(),
    unmarkModified: jest.fn(),
    update: jest.fn(),
    updateOne: jest.fn(),
    validate: jest.fn(),
    validateSync: jest.fn(),
    __v: 0,
  };

  return mockModule as unknown as HydratedDocument<IModule>;
}

function createMockProject(
  data: Partial<IProject> = {},
): HydratedDocument<IProject> {
  const mockProject = {
    _id: data._id || new Types.ObjectId(),
    projectName: data.projectName || 'Test Project',
    projectCode: data.projectCode || 'TEST_PROJ',
    description: data.description,
    modules: data.modules || [],
    projectStatus: data.projectStatus || 'active',
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    isDeleted: data.isDeleted || false,
    deletedAt: data.deletedAt || null,
    $assertPopulated: jest.fn(),
    $clearModifiedPaths: jest.fn(),
    $clone: jest.fn(),
    $createModifiedPathsSnapshot: jest.fn(),
    $getAllSubdocs: jest.fn(),
    $ignore: jest.fn(),
    $isDefault: jest.fn(),
    $isDeleted: jest.fn(),
    $getPopulatedDocs: jest.fn(),
    $inc: jest.fn(),
    $isEmpty: jest.fn(),
    $isValid: jest.fn(),
    $locals: {},
    $markValid: jest.fn(),
    $model: jest.fn(),
    $op: null,
    $parent: null,
    $restoreModifiedPathsSnapshot: jest.fn(),
    $session: jest.fn(),
    $set: jest.fn(),
    $where: {},
    baseModelName: null,
    collection: {} as any,
    db: {} as any,
    delete: jest.fn(),
    deleteOne: jest.fn(),
    depopulate: jest.fn(),
    directModifiedPaths: jest.fn(),
    equals: jest.fn(),
    errors: {},
    get: jest.fn(),
    getChanges: jest.fn(),
    increment: jest.fn(),
    init: jest.fn(),
    invalidate: jest.fn(),
    isDirectModified: jest.fn(),
    isDirectSelected: jest.fn(),
    isInit: jest.fn(),
    isModified: jest.fn(),
    isNew: false,
    isSelected: jest.fn(),
    markModified: jest.fn(),
    model: jest.fn(),
    modifiedPaths: jest.fn(),
    modelName: '',
    overwrite: jest.fn(),
    populate: jest.fn(),
    populated: jest.fn(),
    remove: jest.fn(),
    replaceOne: jest.fn(),
    save: jest.fn(),
    schema: {} as any,
    set: jest.fn(),
    toJSON: jest.fn(),
    toObject: jest.fn(),
    unmarkModified: jest.fn(),
    update: jest.fn(),
    updateOne: jest.fn(),
    validate: jest.fn(),
    validateSync: jest.fn(),
    __v: 0,
  };

  return mockProject as unknown as HydratedDocument<IProject>;
}

describe('ProjectResponseDto', () => {
  it('should transform project data to DTO', () => {
    const mockProject = {
      _id: new Types.ObjectId(),
      projectName: 'Test Project',
      projectCode: 'TEST',
      description: 'Test Description',
      modules: [],
      projectStatus: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      // Add mongoose document methods
      $assertPopulated: jest.fn(),
      $clearModifiedPaths: jest.fn(),
      $clone: jest.fn(),
      $createModifiedPathsSnapshot: jest.fn(),
      $getAllSubdocs: jest.fn(),
      $ignore: jest.fn(),
      $isDefault: jest.fn(),
      $isDeleted: jest.fn(),
      $getPopulatedDocs: jest.fn(),
      $inc: jest.fn(),
      $isEmpty: jest.fn(),
      $isValid: jest.fn(),
      $locals: {},
      $markValid: jest.fn(),
      $model: jest.fn(),
      $op: null,
      $parent: null,
      $session: jest.fn(),
      $set: jest.fn(),
      $where: {},
      baseModelName: null,
      collection: {} as any,
      db: {} as any,
      delete: jest.fn(),
      deleteOne: jest.fn(),
      depopulate: jest.fn(),
      directModifiedPaths: jest.fn(),
      equals: jest.fn(),
      errors: {},
      get: jest.fn(),
      getChanges: jest.fn(),
      increment: jest.fn(),
      init: jest.fn(),
      invalidate: jest.fn(),
      isDirectModified: jest.fn(),
      isDirectSelected: jest.fn(),
      isInit: jest.fn(),
      isModified: jest.fn(),
      isNew: false,
      isSelected: jest.fn(),
      markModified: jest.fn(),
      modifiedPaths: jest.fn(),
      modelName: '',
      overwrite: jest.fn(),
      populate: jest.fn(),
      populated: jest.fn(),
      remove: jest.fn(),
      replaceOne: jest.fn(),
      save: jest.fn(),
      schema: {} as any,
      set: jest.fn(),
      toJSON: jest.fn(),
      toObject: jest.fn(),
      unmarkModified: jest.fn(),
      update: jest.fn(),
      updateOne: jest.fn(),
      validate: jest.fn(),
      validateSync: jest.fn(),
    } as unknown as IProject;

    const dto = new ProjectResponseDto(mockProject);

    expect(dto).toBeInstanceOf(ProjectResponseDto);
    expect(dto.id).toBe(mockProject._id.toString());
    expect(dto.projectName).toBe(mockProject.projectName);
    expect(dto.projectCode).toBe(mockProject.projectCode);
    expect(dto.description).toBe(mockProject.description);
    expect(dto.modules).toEqual([]);
    expect(dto.projectStatus).toBe(mockProject.projectStatus);
    expect(dto.createdAt).toEqual(mockProject.createdAt);
    expect(dto.updatedAt).toEqual(mockProject.updatedAt);
  });

  it('should transform project data with populated modules correctly', () => {
    const mockModule = createMockModule({
      name: 'Test Module',
      code: 'TEST_MOD',
      description: 'Test Description',
      version: '1.0.0',
      isCore: true,
      permissions: ['read', 'write'],
    });

    const mockProject = createMockProject({
      projectName: 'Test Project',
      projectCode: 'TEST_PROJ',
      description: 'Test Project Description',
      modules: [
        {
          moduleId: mockModule,
          isActive: true,
          config: {
            setting1: 'value1',
            setting2: 'value2',
          },
        },
      ],
      projectStatus: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    });

    const dto = new ProjectResponseDto(mockProject);

    expect(dto.id).toBe(mockProject._id.toString());
    expect(dto.projectName).toBe(mockProject.projectName);
    expect(dto.projectCode).toBe(mockProject.projectCode);
    expect(dto.description).toBe(mockProject.description);
    expect(dto.projectStatus).toBe(mockProject.projectStatus);
    expect(dto.createdAt).toEqual(mockProject.createdAt);
    expect(dto.updatedAt).toEqual(mockProject.updatedAt);

    // Check modules transformation
    expect(dto.modules).toHaveLength(1);
    expect(dto.modules[0].moduleId).toBe(mockModule._id.toString());
    expect(dto.modules[0].moduleDetails).toEqual({
      name: mockModule.name,
      code: mockModule.code,
      description: mockModule.description,
      version: mockModule.version,
      isCore: mockModule.isCore,
      permissions: mockModule.permissions,
    });
    expect(dto.modules[0].isActive).toBe(true);
    expect(dto.modules[0].config).toEqual({
      setting1: 'value1',
      setting2: 'value2',
    });
  });

  it('should transform project data with unpopulated modules correctly', () => {
    const moduleId = new Types.ObjectId();
    const mockProject = createMockProject({
      projectName: 'Test Project',
      projectCode: 'TEST_PROJ',
      description: 'Test Project Description',
      modules: [
        {
          moduleId: moduleId,
          isActive: true,
          config: {
            setting1: 'value1',
          },
        },
      ],
      projectStatus: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    });

    const dto = new ProjectResponseDto(mockProject);

    expect(dto.id).toBe(mockProject._id.toString());
    expect(dto.projectName).toBe(mockProject.projectName);
    expect(dto.projectCode).toBe(mockProject.projectCode);
    expect(dto.description).toBe(mockProject.description);
    expect(dto.projectStatus).toBe(mockProject.projectStatus);
    expect(dto.createdAt).toEqual(mockProject.createdAt);
    expect(dto.updatedAt).toEqual(mockProject.updatedAt);

    // Check modules transformation
    expect(dto.modules).toHaveLength(1);
    expect(dto.modules[0].moduleId).toBe(moduleId.toString());
    expect(dto.modules[0].moduleDetails).toBeUndefined();
    expect(dto.modules[0].isActive).toBe(true);
    expect(dto.modules[0].config).toEqual({
      setting1: 'value1',
    });
  });

  it('should handle missing optional fields', () => {
    const mockProject = createMockProject({
      projectName: 'Test Project',
      projectCode: 'TEST_PROJ',
      modules: [],
      projectStatus: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    });

    const dto = new ProjectResponseDto(mockProject);

    expect(dto.id).toBe(mockProject._id.toString());
    expect(dto.projectName).toBe(mockProject.projectName);
    expect(dto.projectCode).toBe(mockProject.projectCode);
    expect(dto.description).toBeUndefined();
    expect(dto.modules).toEqual([]);
    expect(dto.projectStatus).toBe(mockProject.projectStatus);
    expect(dto.createdAt).toEqual(mockProject.createdAt);
    expect(dto.updatedAt).toEqual(mockProject.updatedAt);
  });

  it('should handle null moduleId', () => {
    const mockProject = createMockProject({
      projectName: 'Test Project',
      projectCode: 'TEST_PROJ',
      modules: [
        {
          moduleId: null as any,
          isActive: true,
          config: {},
        },
      ],
      projectStatus: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    });

    const dto = new ProjectResponseDto(mockProject);

    expect(dto.modules).toHaveLength(1);
    expect(dto.modules[0].moduleId).toBe('');
    expect(dto.modules[0].moduleDetails).toBeUndefined();
  });

  it('should validate using class-validator decorators', async () => {
    const mockModule = createMockModule({
      name: 'Test Module',
      code: 'TEST_MOD',
      description: 'Test Description',
      version: '1.0.0',
      isCore: true,
      permissions: ['read', 'write'],
    });

    const mockProject = createMockProject({
      projectName: 'Test Project',
      projectCode: 'TEST_PROJ',
      description: 'Test Project Description',
      modules: [
        {
          moduleId: mockModule,
          isActive: true,
          config: {
            setting1: 'value1',
          },
        },
      ],
      projectStatus: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    });

    const dto = new ProjectResponseDto(mockProject);

    // Validate required string fields
    expect(typeof dto.id).toBe('string');
    expect(typeof dto.projectName).toBe('string');
    expect(typeof dto.projectCode).toBe('string');
    expect(typeof dto.projectStatus).toBe('string');

    // Validate optional string field
    expect(typeof dto.description).toBe('string');

    // Validate array fields
    expect(Array.isArray(dto.modules)).toBe(true);

    // Validate date fields
    expect(dto.createdAt).toBeInstanceOf(Date);
    expect(dto.updatedAt).toBeInstanceOf(Date);

    // Validate module details
    const module = dto.modules[0];
    expect(typeof module.moduleId).toBe('string');
    expect(typeof module.isActive).toBe('boolean');
    expect(module.config).toBeInstanceOf(Object);

    if (module.moduleDetails) {
      expect(typeof module.moduleDetails.name).toBe('string');
      expect(typeof module.moduleDetails.code).toBe('string');
      expect(typeof module.moduleDetails.description).toBe('string');
      expect(typeof module.moduleDetails.version).toBe('string');
      expect(typeof module.moduleDetails.isCore).toBe('boolean');
      expect(Array.isArray(module.moduleDetails.permissions)).toBe(true);
      expect(
        module.moduleDetails.permissions?.every(p => typeof p === 'string'),
      ).toBe(true);
    }
  });
});
