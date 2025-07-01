import { AccessControlService } from '@/modules/accessControl/access-control.service';
import { AccessControlRepository } from '@/modules/accessControl/access-control.repository';
import { ModuleModel } from '@/models/module.model';
import { RoleModel } from '@/models/role.model';
import { NotFoundException } from '@/common/exceptions/not-found.exception';
import { Types } from 'mongoose';

jest.mock('@/modules/accessControl/access-control.repository');
jest.mock('@/models/module.model');
jest.mock('@/models/role.model');

describe('AccessControlService', () => {
  let accessControlService: AccessControlService;
  let mockAccessControlRepository: jest.Mocked<AccessControlRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessControlRepository =
      new AccessControlRepository() as jest.Mocked<AccessControlRepository>;
    accessControlService = new AccessControlService();
    (accessControlService as any).accessControlRepository =
      mockAccessControlRepository;
  });

  describe('getOrCreateDefaultAccessControl', () => {
    const projectId = '507f1f77bcf86cd799439011';
    const channelId = '507f1f77bcf86cd799439012';
    const mockRoles = [
      { _id: new Types.ObjectId('507f1f77bcf86cd799439013') },
      { _id: new Types.ObjectId('507f1f77bcf86cd799439014') },
    ];
    const mockModules = [
      {
        _id: new Types.ObjectId('507f1f77bcf86cd799439015'),
        name: 'Test Module 1',
        code: 'TEST_MOD_1',
      },
      {
        _id: new Types.ObjectId('507f1f77bcf86cd799439016'),
        name: 'Test Module 2',
        code: 'TEST_MOD_2',
      },
    ];

    beforeEach(() => {
      (RoleModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockRoles),
        }),
      });

      (ModuleModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockModules),
        }),
      });

      (ModuleModel.findById as jest.Mock).mockImplementation(id => ({
        select: jest.fn().mockReturnValue({
          lean: jest
            .fn()
            .mockResolvedValue(
              mockModules.find(m => m._id.toString() === id.toString()),
            ),
        }),
      }));
    });

    it('should create default access control when none exists', async () => {
      // Arrange
      mockAccessControlRepository.findByProjectAndChannel.mockResolvedValue(
        null,
      );
      const expectedModuleConfigs = mockModules.map(module => ({
        moduleId: module._id.toString(),
        rolesAssigned: mockRoles.map(role => ({
          roleId: role._id.toString(),
          status: false,
        })),
      }));

      const mockCreatedAccessControl = {
        _id: new Types.ObjectId(),
        projectId,
        channelId,
        moduleConfigs: expectedModuleConfigs,
      };

      mockAccessControlRepository.createOrUpdateAccessControl.mockResolvedValue(
        mockCreatedAccessControl as any,
      );

      // Act
      const result = await accessControlService.getOrCreateDefaultAccessControl(
        projectId,
        channelId,
      );

      // Assert
      expect(
        mockAccessControlRepository.findByProjectAndChannel,
      ).toHaveBeenCalledWith(projectId, channelId);
      expect(
        mockAccessControlRepository.createOrUpdateAccessControl,
      ).toHaveBeenCalledWith(projectId, channelId, expectedModuleConfigs);
      expect(result).toEqual(mockCreatedAccessControl);
    });

    it('should update existing access control with new roles', async () => {
      // Arrange
      const existingConfig = {
        _id: new Types.ObjectId(),
        projectId,
        channelId,
        moduleConfigs: [
          {
            moduleId: {
              _id: mockModules[0]._id,
            },
            roleConfigs: [
              {
                roleId: {
                  _id: mockRoles[0]._id,
                },
                status: true,
              },
            ],
          },
        ],
      };

      mockAccessControlRepository.findByProjectAndChannel.mockResolvedValue(
        existingConfig as any,
      );

      const expectedModuleConfigs = [
        {
          moduleId: mockModules[0]._id,
          moduleCode: mockModules[0].code,
          moduleName: mockModules[0].name,
          rolesAssigned: [
            {
              roleId: mockRoles[0]._id.toString(),
              status: true,
            },
            {
              roleId: mockRoles[1]._id.toString(),
              status: false,
            },
          ],
        },
      ];

      const updatedConfig = {
        ...existingConfig,
        moduleConfigs: expectedModuleConfigs,
      };

      mockAccessControlRepository.createOrUpdateAccessControl.mockResolvedValue(
        updatedConfig as any,
      );

      // Act
      const result = await accessControlService.getOrCreateDefaultAccessControl(
        projectId,
        channelId,
      );

      // Assert
      expect(
        mockAccessControlRepository.findByProjectAndChannel,
      ).toHaveBeenCalledWith(projectId, channelId);
      expect(
        mockAccessControlRepository.createOrUpdateAccessControl,
      ).toHaveBeenCalledWith(projectId, channelId, expectedModuleConfigs);
      expect(result).toEqual(updatedConfig);
    });

    it('should throw NotFoundException when no active roles found', async () => {
      // Arrange
      (RoleModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      // Act & Assert
      await expect(
        accessControlService.getOrCreateDefaultAccessControl(
          projectId,
          channelId,
        ),
      ).rejects.toThrow(
        new NotFoundException('No active roles found for the channel'),
      );
    });

    it('should throw NotFoundException when no active modules found for new config', async () => {
      // Arrange
      mockAccessControlRepository.findByProjectAndChannel.mockResolvedValue(
        null,
      );
      (ModuleModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      // Act & Assert
      await expect(
        accessControlService.getOrCreateDefaultAccessControl(
          projectId,
          channelId,
        ),
      ).rejects.toThrow(new NotFoundException('No active modules found'));
    });

    it('should throw NotFoundException when module not found during update', async () => {
      // Arrange
      const existingConfig = {
        _id: new Types.ObjectId(),
        projectId,
        channelId,
        moduleConfigs: [
          {
            moduleId: {
              _id: new Types.ObjectId('507f1f77bcf86cd799439099'), // Non-existent module
            },
            roleConfigs: [
              {
                roleId: {
                  _id: mockRoles[0]._id,
                },
                status: true,
              },
            ],
          },
        ],
      };

      mockAccessControlRepository.findByProjectAndChannel.mockResolvedValue(
        existingConfig as any,
      );

      (ModuleModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      // Act & Assert
      await expect(
        accessControlService.getOrCreateDefaultAccessControl(
          projectId,
          channelId,
        ),
      ).rejects.toThrow(
        new NotFoundException(
          'Module with id 507f1f77bcf86cd799439099 not found',
        ),
      );
    });
  });

  describe('createOrUpdateAccessControl', () => {
    it('should delegate to repository', async () => {
      // Arrange
      const projectId = '507f1f77bcf86cd799439011';
      const channelId = '507f1f77bcf86cd799439012';
      const moduleConfigs = [
        {
          moduleId: '507f1f77bcf86cd799439015',
          rolesAssigned: [
            {
              roleId: '507f1f77bcf86cd799439013',
              status: true,
            },
          ],
        },
      ];

      const expectedResult = {
        _id: new Types.ObjectId(),
        projectId,
        channelId,
        moduleConfigs,
      };

      mockAccessControlRepository.createOrUpdateAccessControl.mockResolvedValue(
        expectedResult as any,
      );

      // Act
      const result = await accessControlService.createOrUpdateAccessControl(
        projectId,
        channelId,
        moduleConfigs,
      );

      // Assert
      expect(
        mockAccessControlRepository.createOrUpdateAccessControl,
      ).toHaveBeenCalledWith(projectId, channelId, moduleConfigs);
      expect(result).toEqual(expectedResult);
    });
  });
});
