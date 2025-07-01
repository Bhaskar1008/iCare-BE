import { AccessControlController } from '@/modules/accessControl/access-control.controller';
import { AccessControlService } from '@/modules/accessControl/access-control.service';
import type { Request, Response } from 'express';
import { mockRequest, mockResponse } from 'tests/utils/test-utils';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';

jest.mock('@/modules/accessControl/access-control.service');

describe('AccessControlController', () => {
  let accessControlController: AccessControlController;
  let mockAccessControlService: jest.Mocked<AccessControlService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessControlService =
      new AccessControlService() as jest.Mocked<AccessControlService>;
    accessControlController = new AccessControlController();
    (accessControlController as any).accessControlService =
      mockAccessControlService;
  });

  describe('getAccessControlsByProjectAndChannel', () => {
    it('should get access controls by project and channel successfully', async () => {
      // Arrange
      const req = mockRequest(
        {},
        {
          projectId: '507f1f77bcf86cd799439011',
          channelId: '507f1f77bcf86cd799439012',
        },
      ) as unknown as Request;
      const res = mockResponse() as unknown as Response;

      const mockAccessControl = {
        _id: '507f1f77bcf86cd799439013',
        projectId: '507f1f77bcf86cd799439011',
        channelId: '507f1f77bcf86cd799439012',
        moduleConfigs: [
          {
            moduleId: {
              _id: '507f1f77bcf86cd799439014',
              name: 'Test Module',
              code: 'TEST_MOD',
            },
            roleConfigs: [
              {
                roleId: {
                  _id: '507f1f77bcf86cd799439015',
                  roleName: 'Test Role',
                  roleCode: 101,
                },
                status: true,
              },
            ],
          },
        ],
      };

      mockAccessControlService.getOrCreateDefaultAccessControl.mockResolvedValue(
        mockAccessControl as any,
      );

      // Act
      await accessControlController.getAccessControlsByProjectAndChannel(
        req,
        res,
      );

      // Assert
      expect(
        mockAccessControlService.getOrCreateDefaultAccessControl,
      ).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      );
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: expect.any(Object),
      });
    });

    it('should handle errors when getting access controls', async () => {
      // Arrange
      const req = mockRequest(
        {},
        {
          projectId: '507f1f77bcf86cd799439011',
          channelId: '507f1f77bcf86cd799439012',
        },
      ) as unknown as Request;
      const res = mockResponse() as unknown as Response;

      const error = new Error('Failed to get access controls');
      mockAccessControlService.getOrCreateDefaultAccessControl.mockRejectedValue(
        error,
      );

      // Act
      await accessControlController.getAccessControlsByProjectAndChannel(
        req,
        res,
      );

      // Assert
      expect(
        mockAccessControlService.getOrCreateDefaultAccessControl,
      ).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      );
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: error.message,
      });
    });

    it('should handle non-Error exceptions', async () => {
      const req = mockRequest(
        {},
        {
          projectId: '507f1f77bcf86cd799439011',
          channelId: '507f1f77bcf86cd799439012',
        },
      ) as unknown as Request;
      const res = mockResponse() as unknown as Response;

      mockAccessControlService.getOrCreateDefaultAccessControl.mockRejectedValue(
        'Non-error thrown',
      );

      await accessControlController.getAccessControlsByProjectAndChannel(
        req,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
      });
    });
  });

  describe('createOrUpdateAccessControl', () => {
    it('should create or update access control successfully', async () => {
      // Arrange
      const moduleConfigDto = {
        projectId: '507f1f77bcf86cd799439011',
        channelId: '507f1f77bcf86cd799439012',
        moduleConfigs: [
          {
            moduleId: '507f1f77bcf86cd799439014',
            rolesAssigned: [
              {
                roleId: '507f1f77bcf86cd799439015',
                status: true,
              },
            ],
          },
        ],
      };

      const req = mockRequest(moduleConfigDto) as unknown as Request;
      const res = mockResponse() as unknown as Response;

      const mockAccessControl = {
        _id: '507f1f77bcf86cd799439013',
        projectId: '507f1f77bcf86cd799439011',
        channelId: '507f1f77bcf86cd799439012',
        moduleConfigs: [
          {
            moduleId: {
              _id: '507f1f77bcf86cd799439014',
              name: 'Test Module',
              code: 'TEST_MOD',
            },
            roleConfigs: [
              {
                roleId: {
                  _id: '507f1f77bcf86cd799439015',
                  roleName: 'Test Role',
                  roleCode: 101,
                },
                status: true,
              },
            ],
          },
        ],
      };

      mockAccessControlService.createOrUpdateAccessControl.mockResolvedValue(
        mockAccessControl as any,
      );

      // Act
      await accessControlController.createOrUpdateAccessControl(req, res);

      // Assert
      expect(
        mockAccessControlService.createOrUpdateAccessControl,
      ).toHaveBeenCalledWith(
        moduleConfigDto.projectId,
        moduleConfigDto.channelId,
        moduleConfigDto.moduleConfigs,
      );
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: expect.any(Object),
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidDto = {
        projectId: '507f1f77bcf86cd799439011',
        // Missing required channelId and moduleConfigs
      };

      const req = mockRequest(invalidDto) as unknown as Request;
      const res = mockResponse() as unknown as Response;

      const validationError = new Error('Validation failed');
      mockAccessControlService.createOrUpdateAccessControl.mockRejectedValue(
        validationError,
      );

      // Act
      await accessControlController.createOrUpdateAccessControl(req, res);

      // Assert
      expect(
        mockAccessControlService.createOrUpdateAccessControl,
      ).toHaveBeenCalledWith(invalidDto.projectId, '', []);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: validationError.message,
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const moduleConfigDto = {
        projectId: '507f1f77bcf86cd799439011',
        channelId: '507f1f77bcf86cd799439012',
        moduleConfigs: [
          {
            moduleId: '507f1f77bcf86cd799439014',
            rolesAssigned: [
              {
                roleId: '507f1f77bcf86cd799439015',
                status: true,
              },
            ],
          },
        ],
      };

      const req = mockRequest(moduleConfigDto) as unknown as Request;
      const res = mockResponse() as unknown as Response;

      const error = new Error('Service error');
      mockAccessControlService.createOrUpdateAccessControl.mockRejectedValue(
        error,
      );

      // Act
      await accessControlController.createOrUpdateAccessControl(req, res);

      // Assert
      expect(
        mockAccessControlService.createOrUpdateAccessControl,
      ).toHaveBeenCalledWith(
        moduleConfigDto.projectId,
        moduleConfigDto.channelId,
        moduleConfigDto.moduleConfigs,
      );
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: error.message,
      });
    });

    it('should handle non-Error exceptions', async () => {
      const moduleConfigDto = {
        projectId: '507f1f77bcf86cd799439011',
        channelId: '507f1f77bcf86cd799439012',
        moduleConfigs: [
          {
            moduleId: '507f1f77bcf86cd799439014',
            rolesAssigned: [
              {
                roleId: '507f1f77bcf86cd799439015',
                status: true,
              },
            ],
          },
        ],
      };

      const req = mockRequest(moduleConfigDto) as unknown as Request;
      const res = mockResponse() as unknown as Response;

      mockAccessControlService.createOrUpdateAccessControl.mockRejectedValue(
        'Non-error thrown',
      );

      await accessControlController.createOrUpdateAccessControl(req, res);

      expect(res.status).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
      });
    });
  });
});
