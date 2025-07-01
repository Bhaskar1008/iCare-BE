import { AccessControlRepository } from '@/modules/accessControl/access-control.repository';
import { AccessControlModel } from '@/models/access-control.model';
import { ModuleModel } from '@/models/module.model';
import { Types } from 'mongoose';
import type { AccessControlQueryDto } from '@/modules/accessControl/dto/access-control-query.dto';
import type { IAccessControl } from '@/models/access-control.model';

jest.mock('@/models/access-control.model');
jest.mock('@/models/module.model');

describe('AccessControlRepository', () => {
  let repository: AccessControlRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new AccessControlRepository();

    // Setup default ModuleModel.findOne chain mock
    (ModuleModel.findOne as jest.Mock).mockImplementation(() => ({
      select: () => ({
        lean: () => Promise.resolve(null),
      }),
    }));
  });

  describe('findByProjectAndChannel', () => {
    it('should find access control by project and channel', async () => {
      const mockAccessControl = {
        _id: new Types.ObjectId(),
        projectId: new Types.ObjectId(),
        channelId: new Types.ObjectId(),
        moduleConfigs: [],
      };

      (AccessControlModel.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockAccessControl),
          }),
        }),
      });

      const result = await repository.findByProjectAndChannel(
        mockAccessControl.projectId.toString(),
        mockAccessControl.channelId.toString(),
      );

      expect(result).toEqual(mockAccessControl);
      expect(AccessControlModel.findOne).toHaveBeenCalledWith({
        projectId: mockAccessControl.projectId.toString(),
        channelId: mockAccessControl.channelId.toString(),
        isDeleted: false,
      });
    });

    it('should return null when no access control found', async () => {
      (AccessControlModel.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      const result = await repository.findByProjectAndChannel(
        'nonexistentProject',
        'nonexistentChannel',
      );

      expect(result).toBeNull();
    });

    it('should handle database errors in findByProjectAndChannel', async () => {
      const error = new Error('Database error');
      (AccessControlModel.findOne as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect(
        repository.findByProjectAndChannel('projectId', 'channelId'),
      ).rejects.toThrow('Database error');
    });

    it('should handle population errors', async () => {
      (AccessControlModel.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockImplementation(() => {
          throw new Error('Population error');
        }),
      });

      await expect(
        repository.findByProjectAndChannel('projectId', 'channelId'),
      ).rejects.toThrow('Population error');
    });
  });

  describe('createOrUpdateAccessControl', () => {
    it('should create or update access control configuration', async () => {
      const projectId = new Types.ObjectId();
      const channelId = new Types.ObjectId();
      const moduleId = new Types.ObjectId();

      const mockModule = {
        _id: moduleId,
        name: 'Test Module',
        code: 'TEST_MODULE',
      };

      const mockModuleConfigs = [
        {
          moduleId: moduleId.toString(),
          rolesAssigned: [
            {
              roleId: new Types.ObjectId().toString(),
              status: true,
            },
          ],
        },
      ];

      // Mock ModuleModel.findOne chain for this test
      (ModuleModel.findOne as jest.Mock).mockImplementation(() => ({
        select: () => ({
          lean: () => Promise.resolve(mockModule),
        }),
      }));

      const mockAccessControl = {
        _id: new Types.ObjectId(),
        projectId,
        channelId,
        moduleConfigs: [
          {
            moduleId: mockModule,
            roleConfigs: mockModuleConfigs[0].rolesAssigned,
          },
        ],
      };

      (AccessControlModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockAccessControl),
          }),
        }),
      });

      const result = await repository.createOrUpdateAccessControl(
        projectId.toString(),
        channelId.toString(),
        mockModuleConfigs,
      );

      expect(result).toEqual(mockAccessControl);
      expect(AccessControlModel.findOneAndUpdate).toHaveBeenCalled();
    });

    it('should throw error when module not found', async () => {
      // Mock returns null to simulate module not found
      (ModuleModel.findOne as jest.Mock).mockImplementation(() => ({
        select: () => ({
          lean: () => Promise.resolve(null),
        }),
      }));

      await expect(
        repository.createOrUpdateAccessControl('projectId', 'channelId', [
          { moduleId: 'nonexistentModule', rolesAssigned: [] },
        ]),
      ).rejects.toThrow('Module with id nonexistentModule not found');
    });

    it('should handle database errors in findOneAndUpdate', async () => {
      const moduleId = new Types.ObjectId();
      const mockModule = {
        _id: moduleId,
        name: 'Test Module',
        code: 'TEST_MODULE',
      };

      // Mock module lookup to succeed
      (ModuleModel.findOne as jest.Mock).mockImplementation(() => ({
        select: () => ({
          lean: () => Promise.resolve(mockModule),
        }),
      }));

      // Mock findOneAndUpdate to throw
      (AccessControlModel.findOneAndUpdate as jest.Mock).mockImplementation(
        () => {
          throw new Error('Database error');
        },
      );

      await expect(
        repository.createOrUpdateAccessControl('projectId', 'channelId', [
          { moduleId: moduleId.toString(), rolesAssigned: [] },
        ]),
      ).rejects.toThrow('Database error');
    });

    it('should handle population errors in findOneAndUpdate', async () => {
      const moduleId = new Types.ObjectId();
      const mockModule = {
        _id: moduleId,
        name: 'Test Module',
        code: 'TEST_MODULE',
      };

      // Mock module lookup to succeed
      (ModuleModel.findOne as jest.Mock).mockImplementation(() => ({
        select: () => ({
          lean: () => Promise.resolve(mockModule),
        }),
      }));

      // Mock population to throw
      (AccessControlModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockImplementation(() => {
          throw new Error('Population error');
        }),
      });

      await expect(
        repository.createOrUpdateAccessControl('projectId', 'channelId', [
          { moduleId: moduleId.toString(), rolesAssigned: [] },
        ]),
      ).rejects.toThrow('Population error');
    });

    it('should throw error when findOneAndUpdate returns null', async () => {
      const moduleId = new Types.ObjectId();
      const mockModule = {
        _id: moduleId,
        name: 'Test Module',
        code: 'TEST_MODULE',
      };

      // Mock module lookup to succeed
      (ModuleModel.findOne as jest.Mock).mockImplementation(() => ({
        select: () => ({
          lean: () => Promise.resolve(mockModule),
        }),
      }));

      // Mock findOneAndUpdate to return null after population
      (AccessControlModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      await expect(
        repository.createOrUpdateAccessControl('projectId', 'channelId', [
          { moduleId: moduleId.toString(), rolesAssigned: [] },
        ]),
      ).rejects.toThrow('Failed to create/update access control configuration');
    });
  });

  describe('createAccessControl', () => {
    it('should create a new access control', async () => {
      const mockData = {
        projectId: new Types.ObjectId().toString(),
        channelId: new Types.ObjectId().toString(),
        moduleConfigs: [],
      };

      const mockSave = jest.fn().mockResolvedValue(mockData);
      (AccessControlModel as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await repository.createAccessControl(mockData);

      expect(result).toEqual(mockData);
      expect(AccessControlModel).toHaveBeenCalledWith(mockData);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should handle save errors', async () => {
      const mockData = {
        projectId: new Types.ObjectId().toString(),
        channelId: new Types.ObjectId().toString(),
        moduleConfigs: [],
      };

      const mockSave = jest.fn().mockRejectedValue(new Error('Save failed'));
      (AccessControlModel as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));

      await expect(repository.createAccessControl(mockData)).rejects.toThrow(
        'Save failed',
      );
    });
  });

  describe('findWithPagination', () => {
    it('should find access controls with pagination', async () => {
      const mockQuery: AccessControlQueryDto = {
        projectId: new Types.ObjectId().toString(),
        channelId: new Types.ObjectId().toString(),
        moduleId: new Types.ObjectId().toString(),
        page: 2,
        limit: 5,
        sortBy: 'updatedAt',
        sortOrder: 'asc' as const,
      };

      const mockAccessControls = [
        { _id: new Types.ObjectId(), projectId: mockQuery.projectId },
        { _id: new Types.ObjectId(), projectId: mockQuery.projectId },
      ];

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAccessControls),
      };

      (AccessControlModel.find as unknown as jest.Mock).mockReturnValue(
        mockFind,
      );
      (
        AccessControlModel.countDocuments as unknown as jest.Mock
      ).mockResolvedValue(10);

      const result = await repository.findWithPagination(mockQuery);

      expect(result).toEqual({
        accessControls: mockAccessControls,
        total: 10,
        page: 2,
        limit: 5,
      });

      expect(AccessControlModel.find).toHaveBeenCalledWith({
        projectId: mockQuery.projectId,
        channelId: mockQuery.channelId,
        moduleId: mockQuery.moduleId,
        isDeleted: false,
      });

      expect(mockFind.sort).toHaveBeenCalledWith({ updatedAt: 1 });
      expect(mockFind.skip).toHaveBeenCalledWith(5);
      expect(mockFind.limit).toHaveBeenCalledWith(5);
    });

    it('should use default pagination values', async () => {
      const mockQuery = {
        projectId: new Types.ObjectId().toString(),
      };

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (AccessControlModel.find as jest.Mock).mockReturnValue(mockFind);
      (AccessControlModel.countDocuments as jest.Mock).mockResolvedValue(0);

      const result = await repository.findWithPagination(mockQuery);

      expect(result).toEqual({
        accessControls: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      expect(mockFind.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockFind.skip).toHaveBeenCalledWith(0);
      expect(mockFind.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('findById', () => {
    it('should find access control by id', async () => {
      const mockId = new Types.ObjectId().toString();
      const mockAccessControl = {
        _id: mockId,
        projectId: new Types.ObjectId(),
        channelId: new Types.ObjectId(),
      };

      (AccessControlModel.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAccessControl),
      });

      const result = await repository.findById(mockId);

      expect(result).toEqual(mockAccessControl);
      expect(AccessControlModel.findOne).toHaveBeenCalledWith({
        _id: mockId,
        isDeleted: false,
      });
    });

    it('should return null when not found', async () => {
      const mockId = new Types.ObjectId().toString();

      (AccessControlModel.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findById(mockId);

      expect(result).toBeNull();
    });
  });

  describe('findByIdAndUpdate', () => {
    it('should update access control by id', async () => {
      const mockId = new Types.ObjectId().toString();
      const mockUpdate = {
        projectId: new Types.ObjectId().toString(),
        channelId: new Types.ObjectId().toString(),
      };
      const mockUpdated = { _id: mockId, ...mockUpdate };

      (AccessControlModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUpdated),
      });

      const result = await repository.findByIdAndUpdate(mockId, mockUpdate);

      expect(result).toEqual(mockUpdated);
      expect(AccessControlModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockId, isDeleted: false },
        { $set: mockUpdate },
        { new: true },
      );
    });

    it('should return null when update target not found', async () => {
      const mockId = new Types.ObjectId().toString();
      const mockUpdate = {
        projectId: new Types.ObjectId().toString(),
      };

      (AccessControlModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findByIdAndUpdate(mockId, mockUpdate);

      expect(result).toBeNull();
    });
  });

  describe('updateModuleConfigs', () => {
    it('should update module configs', async () => {
      const projectId = new Types.ObjectId();
      const channelId = new Types.ObjectId();
      const moduleId = new Types.ObjectId();

      const mockModuleConfigs = [
        {
          moduleId,
          roleConfigs: [
            {
              roleId: new Types.ObjectId(),
              status: true,
            },
          ],
        },
      ];

      const mockUpdated: Partial<IAccessControl> = {
        projectId,
        channelId,
        moduleConfigs: mockModuleConfigs,
      };

      (AccessControlModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUpdated),
      });

      const result = await repository.updateModuleConfigs(
        projectId.toString(),
        channelId.toString(),
        mockModuleConfigs,
      );

      expect(result).toEqual(mockUpdated);
      expect(AccessControlModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          projectId: projectId.toString(),
          channelId: channelId.toString(),
          isDeleted: false,
        },
        {
          $set: { moduleConfigs: mockModuleConfigs },
        },
        { new: true },
      );
    });

    it('should return null when update target not found', async () => {
      const projectId = new Types.ObjectId();
      const channelId = new Types.ObjectId();
      const mockModuleConfigs = [
        {
          moduleId: new Types.ObjectId(),
          roleConfigs: [
            {
              roleId: new Types.ObjectId(),
              status: false,
            },
          ],
        },
      ];

      (AccessControlModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.updateModuleConfigs(
        projectId.toString(),
        channelId.toString(),
        mockModuleConfigs,
      );

      expect(result).toBeNull();
    });
  });

  describe('findByIdAndDelete', () => {
    it('should soft delete access control', async () => {
      const mockId = new Types.ObjectId().toString();

      (AccessControlModel.findOneAndUpdate as jest.Mock).mockResolvedValue({
        _id: mockId,
        isDeleted: true,
        deletedAt: expect.any(Date),
      });

      await repository.findByIdAndDelete(mockId);

      expect(AccessControlModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockId, isDeleted: false },
        {
          $set: {
            isDeleted: true,
            deletedAt: expect.any(Date),
          },
        },
      );
    });

    it('should handle delete errors', async () => {
      const mockId = new Types.ObjectId().toString();

      (AccessControlModel.findOneAndUpdate as jest.Mock).mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(repository.findByIdAndDelete(mockId)).rejects.toThrow(
        'Delete failed',
      );
    });
  });
});
