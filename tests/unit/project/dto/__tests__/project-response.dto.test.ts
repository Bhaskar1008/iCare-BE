import { Types } from 'mongoose';
import type { IProject } from '@/models/project.model';
import type { IModule } from '@/models/module.model';
import { ProjectResponseDto } from '@/modules/project/dto/project-response.dto';

describe('ProjectResponseDto', () => {
  const mockDate = new Date();

  const mockModule = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    name: 'Test Module',
    code: 'TEST_MODULE',
    description: 'Test Description',
    version: '1.0.0',
    isCore: false,
    permissions: ['perm1', 'perm2'],
    defaultConfig: [],
    isActive: true,
    createdAt: mockDate,
    updatedAt: mockDate,
  } as unknown as IModule;

  const mockProject = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
    projectName: 'Test Project',
    projectCode: 'TEST_PROJECT',
    description: 'Test Description',
    modules: [
      {
        moduleId: mockModule,
        isActive: true,
        config: { key: 'value' },
      },
    ],
    projectStatus: 'active',
    createdAt: mockDate,
    updatedAt: mockDate,
  } as unknown as IProject;

  it('should transform project to response DTO', () => {
    const response = new ProjectResponseDto(mockProject);

    expect(response.id).toBe(mockProject._id.toString());
    expect(response.projectName).toBe(mockProject.projectName);
    expect(response.projectCode).toBe(mockProject.projectCode);
    expect(response.description).toBe(mockProject.description);
    expect(response.projectStatus).toBe(mockProject.projectStatus);
    expect(response.createdAt).toEqual(mockProject.createdAt);
    expect(response.updatedAt).toEqual(mockProject.updatedAt);
  });

  it('should transform module details correctly', () => {
    const response = new ProjectResponseDto(mockProject);
    const moduleResponse = response.modules[0];

    expect(moduleResponse.moduleId).toBe(mockModule._id.toString());
    expect(moduleResponse.moduleDetails).toBeDefined();
    expect(moduleResponse.moduleDetails?.name).toBe(mockModule.name);
    expect(moduleResponse.moduleDetails?.code).toBe(mockModule.code);
    expect(moduleResponse.moduleDetails?.description).toBe(
      mockModule.description,
    );
    expect(moduleResponse.moduleDetails?.version).toBe(mockModule.version);
    expect(moduleResponse.moduleDetails?.isCore).toBe(mockModule.isCore);
    expect(moduleResponse.moduleDetails?.permissions).toEqual(
      mockModule.permissions,
    );
    expect(moduleResponse.isActive).toBe(true);
    expect(moduleResponse.config).toEqual({ key: 'value' });
  });

  it('should handle project without module details', () => {
    const projectWithoutModuleDetails = {
      ...mockProject,
      modules: [
        {
          moduleId: new Types.ObjectId('507f1f77bcf86cd799439013'),
          isActive: true,
          config: {},
        },
      ],
    } as unknown as IProject;

    const response = new ProjectResponseDto(projectWithoutModuleDetails);
    const moduleResponse = response.modules[0];

    expect(moduleResponse.moduleId).toBe('507f1f77bcf86cd799439013');
    expect(moduleResponse.moduleDetails).toBeUndefined();
    expect(moduleResponse.isActive).toBe(true);
    expect(moduleResponse.config).toEqual({});
  });

  it('should handle empty modules array', () => {
    const projectWithoutModules = {
      ...mockProject,
      modules: [],
    } as unknown as IProject;

    const response = new ProjectResponseDto(projectWithoutModules);
    expect(response.modules).toEqual([]);
  });

  it('should handle undefined optional fields', () => {
    const projectWithoutOptionals = {
      _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
      projectName: 'Test Project',
      projectCode: 'TEST_PROJECT',
      modules: [],
      projectStatus: 'active',
      createdAt: mockDate,
      updatedAt: mockDate,
    } as unknown as IProject;

    const response = new ProjectResponseDto(projectWithoutOptionals);
    expect(response.description).toBeUndefined();
  });

  it('should handle invalid module ID', () => {
    const projectWithInvalidModule = {
      ...mockProject,
      modules: [
        {
          moduleId: null as any,
          isActive: true,
          config: {},
        },
      ],
    } as unknown as IProject;

    const response = new ProjectResponseDto(projectWithInvalidModule);
    expect(response.modules[0].moduleId).toBe('');
  });
});
