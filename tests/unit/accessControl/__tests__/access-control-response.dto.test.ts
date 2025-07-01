import { AccessControlResponseDto } from '@/modules/accessControl/dto/access-control-response.dto';
import type { IAccessControl } from '@/models/access-control.model';
import { Types } from 'mongoose';

describe('AccessControlResponseDto', () => {
  describe('constructor', () => {
    const mockDate = new Date('2024-01-01');

    it('should transform access control data correctly', () => {
      const mockAccessControl = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439013'),
        projectId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        channelId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        moduleConfigs: [
          {
            moduleId: {
              _id: new Types.ObjectId('507f1f77bcf86cd799439014'),
              name: 'Test Module',
              code: 'TEST_MOD',
            },
            roleConfigs: [
              {
                roleId: {
                  _id: new Types.ObjectId('507f1f77bcf86cd799439015'),
                  roleName: 'Test Role',
                  roleCode: 101,
                },
                status: true,
              },
            ],
          },
        ],
        createdAt: mockDate,
        updatedAt: mockDate,
        isDeleted: false,
        deletedAt: null,
      } as unknown as IAccessControl;

      const dto = new AccessControlResponseDto(mockAccessControl);

      expect(dto).toEqual({
        id: '507f1f77bcf86cd799439013',
        projectId: '507f1f77bcf86cd799439011',
        channelId: '507f1f77bcf86cd799439012',
        moduleConfigs: [
          {
            moduleId: '507f1f77bcf86cd799439014',
            moduleName: 'Test Module',
            moduleCode: 'TEST_MOD',
            rolesAssigned: [
              {
                roleId: '507f1f77bcf86cd799439015',
                roleName: 'Test Role',
                roleCode: '101',
                status: true,
              },
            ],
          },
        ],
        createdAt: mockDate,
        updatedAt: mockDate,
      });
    });

    it('should handle missing optional fields', () => {
      const mockAccessControl = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439013'),
        projectId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        channelId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        moduleConfigs: [
          {
            moduleId: {
              _id: new Types.ObjectId('507f1f77bcf86cd799439014'),
            },
            roleConfigs: [
              {
                roleId: {
                  _id: new Types.ObjectId('507f1f77bcf86cd799439015'),
                },
                status: true,
              },
            ],
          },
        ],
        createdAt: mockDate,
        updatedAt: mockDate,
        isDeleted: false,
        deletedAt: null,
      } as unknown as IAccessControl;

      const dto = new AccessControlResponseDto(mockAccessControl);

      expect(dto).toEqual({
        id: '507f1f77bcf86cd799439013',
        projectId: '507f1f77bcf86cd799439011',
        channelId: '507f1f77bcf86cd799439012',
        moduleConfigs: [
          {
            moduleId: '507f1f77bcf86cd799439014',
            moduleName: '',
            moduleCode: '',
            rolesAssigned: [
              {
                roleId: '507f1f77bcf86cd799439015',
                roleName: '',
                roleCode: '',
                status: true,
              },
            ],
          },
        ],
        createdAt: mockDate,
        updatedAt: mockDate,
      });
    });

    it('should handle empty module configs array', () => {
      const mockAccessControl = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439013'),
        projectId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        channelId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        moduleConfigs: [],
        createdAt: mockDate,
        updatedAt: mockDate,
        isDeleted: false,
        deletedAt: null,
      } as unknown as IAccessControl;

      const dto = new AccessControlResponseDto(mockAccessControl);

      expect(dto).toEqual({
        id: '507f1f77bcf86cd799439013',
        projectId: '507f1f77bcf86cd799439011',
        channelId: '507f1f77bcf86cd799439012',
        moduleConfigs: [],
        createdAt: mockDate,
        updatedAt: mockDate,
      });
    });

    it('should handle null values in nested objects', () => {
      const mockAccessControl = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439013'),
        projectId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        channelId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        moduleConfigs: [
          {
            moduleId: null,
            roleConfigs: [
              {
                roleId: null,
                status: true,
              },
            ],
          },
        ],
        createdAt: mockDate,
        updatedAt: mockDate,
        isDeleted: false,
        deletedAt: null,
      } as unknown as IAccessControl;

      const dto = new AccessControlResponseDto(mockAccessControl);

      expect(dto).toEqual({
        id: '507f1f77bcf86cd799439013',
        projectId: '507f1f77bcf86cd799439011',
        channelId: '507f1f77bcf86cd799439012',
        moduleConfigs: [
          {
            moduleId: '',
            moduleName: '',
            moduleCode: '',
            rolesAssigned: [
              {
                roleId: '',
                roleName: '',
                roleCode: '',
                status: true,
              },
            ],
          },
        ],
        createdAt: mockDate,
        updatedAt: mockDate,
      });
    });
  });
});
