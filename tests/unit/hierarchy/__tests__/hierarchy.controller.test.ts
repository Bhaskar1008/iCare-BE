import { HierarchyController } from '@/modules/hierarchy/hierarchy.controller';
import { HierarchyService } from '@/modules/hierarchy/hierarchy.service';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';
import {
  HTTP_STATUS,
  HIERARCHY,
} from '@/common/constants/http-status.constants';
import type { Request, Response } from 'express';
import { mockRequest, mockResponse } from 'tests/utils/test-utils';
import { Types } from 'mongoose';
import type { HierarchyResponseDto } from '@/modules/hierarchy/dto/hierarchy-response.dto';

jest.mock('@/modules/hierarchy/hierarchy.service');
jest.mock('@/common/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

function createMockHierarchyResponse(
  data: Partial<HierarchyResponseDto> = {},
): HierarchyResponseDto {
  const now = new Date();
  return {
    _id: data._id || new Types.ObjectId().toString(),
    hierarchyName: data.hierarchyName || 'Test Hierarchy',
    hierarchyLevelCode: data.hierarchyLevelCode || 'TEST_LEVEL',
    hierarchyLevel: data.hierarchyLevel || 1,
    hierarchyOrder: data.hierarchyOrder || 0,
    hierarchyStatus: data.hierarchyStatus || 'active',
    hierarchyParentId: data.hierarchyParentId,
    hierarchyDescription: data.hierarchyDescription,
    channelName: data.channelName,
    channelCode: data.channelCode,
    parentName: data.parentName,
    isActive: true,
    isRoot: !data.hierarchyParentId,
    hasParent: !!data.hierarchyParentId,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  };
}

describe('HierarchyController', () => {
  let hierarchyController: HierarchyController;
  let mockHierarchyService: jest.Mocked<HierarchyService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockHierarchyService = {
      createHierarchy: jest.fn(),
      getHierarchyById: jest.fn(),
      getHierarchiesByChannel: jest.fn(),
      getHierarchiesByChannelAndLevel: jest.fn(),
      getRootHierarchies: jest.fn(),
      getChildHierarchies: jest.fn(),
      getAllHierarchies: jest.fn(),
      getHierarchyTeamMemberList: jest.fn(),
      updateHierarchy: jest.fn(),
      deleteHierarchy: jest.fn(),
      getHierarchyByAgentId: jest.fn(),
      getAgentsByHierarchyDesignation: jest.fn(),
    } as unknown as jest.Mocked<HierarchyService>;

    hierarchyController = new HierarchyController();
    (hierarchyController as any).hierarchyService = mockHierarchyService;
  });

  describe('createHierarchy', () => {
    const mockHierarchyData = {
      channelId: new Types.ObjectId().toString(),
      name: 'Test Hierarchy',
      level: 1,
      status: 'active',
    };

    it('should create hierarchy successfully', async () => {
      const mockCreatedHierarchy = createMockHierarchyResponse({
        hierarchyName: mockHierarchyData.name,
        hierarchyLevel: mockHierarchyData.level,
        hierarchyStatus: mockHierarchyData.status as 'active' | 'inactive',
      });

      mockHierarchyService.createHierarchy.mockResolvedValue(
        mockCreatedHierarchy,
      );

      const req = mockRequest(mockHierarchyData) as Request;
      const res = mockResponse() as Response;

      await hierarchyController.createHierarchy(req, res);

      expect(mockHierarchyService.createHierarchy).toHaveBeenCalledWith(
        mockHierarchyData,
      );
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Hierarchy created successfully',
          data: mockCreatedHierarchy,
        }),
      );
    });

    it('should handle validation error', async () => {
      const error = new DatabaseValidationException('Validation failed');
      mockHierarchyService.createHierarchy.mockRejectedValue(error);

      const req = mockRequest(mockHierarchyData) as Request;
      const res = mockResponse() as Response;

      await hierarchyController.createHierarchy(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Validation failed',
        }),
      );
    });
  });

  describe('getHierarchyById', () => {
    const mockId = new Types.ObjectId().toString();

    it('should get hierarchy by id successfully', async () => {
      const mockHierarchy = createMockHierarchyResponse({ _id: mockId });

      mockHierarchyService.getHierarchyById.mockResolvedValue(mockHierarchy);

      const req = mockRequest({}, { id: mockId }) as Request;
      const res = mockResponse() as Response;

      await hierarchyController.getHierarchyById(req, res);

      expect(mockHierarchyService.getHierarchyById).toHaveBeenCalledWith(
        mockId,
      );
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Hierarchy retrieved successfully',
          data: mockHierarchy,
        }),
      );
    });

    it('should handle not found error', async () => {
      mockHierarchyService.getHierarchyById.mockResolvedValue(null);

      const req = mockRequest({}, { id: mockId }) as Request;
      const res = mockResponse() as Response;

      await hierarchyController.getHierarchyById(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Hierarchy not found',
        }),
      );
    });

    it('should handle missing id parameter', async () => {
      const req = mockRequest({}, {}) as Request;
      const res = mockResponse() as Response;

      await hierarchyController.getHierarchyById(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Hierarchy ID is required',
        }),
      );
    });
  });

  describe('getHierarchiesByChannelAndLevel', () => {
    const mockChannelId = new Types.ObjectId().toString();
    const mockLevel = '1';

    it('should get hierarchies by channel and level successfully', async () => {
      const mockHierarchies = [
        createMockHierarchyResponse({
          hierarchyLevel: parseInt(mockLevel),
        }),
      ];

      mockHierarchyService.getHierarchiesByChannelAndLevel.mockResolvedValue(
        mockHierarchies,
      );

      const req = mockRequest(
        {},
        { channelId: mockChannelId },
        { level: mockLevel },
      ) as Request;
      const res = mockResponse() as Response;

      await hierarchyController.getHierarchiesByChannelAndLevel(req, res);

      expect(
        mockHierarchyService.getHierarchiesByChannelAndLevel,
      ).toHaveBeenCalledWith(mockChannelId, parseInt(mockLevel));
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Hierarchies retrieved successfully',
          data: mockHierarchies,
        }),
      );
    });

    it('should handle missing channel id', async () => {
      const req = mockRequest({}, {}, { level: mockLevel }) as Request;
      const res = mockResponse() as Response;

      await hierarchyController.getHierarchiesByChannelAndLevel(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Channel ID is required',
        }),
      );
    });

    it('should handle missing level', async () => {
      const req = mockRequest({}, { channelId: mockChannelId }, {}) as Request;
      const res = mockResponse() as Response;

      await hierarchyController.getHierarchiesByChannelAndLevel(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Level is required',
        }),
      );
    });

    it('should handle invalid level', async () => {
      const req = mockRequest(
        {},
        { channelId: mockChannelId },
        { level: '0' },
      ) as Request;
      const res = mockResponse() as Response;

      await hierarchyController.getHierarchiesByChannelAndLevel(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: `Level must be at least ${HIERARCHY.MIN_LEVEL}`,
        }),
      );
    });
  });

  describe('getHierarchyTeamMemberList', () => {
    const mockChannelId = new Types.ObjectId().toString();
    const mockUserId = new Types.ObjectId().toString();
    const mockCurrentUser = {
      channelId: mockChannelId,
      id: mockUserId,
    };

    it('should get team member list successfully', async () => {
      const mockTeamMembers = [
        {
          _id: new Types.ObjectId().toString(),
          name: 'Team Member 1',
        },
      ];

      mockHierarchyService.getHierarchyTeamMemberList.mockResolvedValue(
        mockTeamMembers,
      );

      const req = {
        query: { teamMembers: 'true' },
        headers: { currentuser: JSON.stringify(mockCurrentUser) },
      } as unknown as Request;

      const res = mockResponse() as Response;

      await hierarchyController.getHierarchyTeamMemberList(req, res);

      expect(
        mockHierarchyService.getHierarchyTeamMemberList,
      ).toHaveBeenCalledWith(mockChannelId, mockUserId, true);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Data retrieved successfully',
          data: mockTeamMembers,
        }),
      );
    });

    it('should handle missing current user header', async () => {
      const req = {
        query: { teamMembers: 'true' },
        headers: {},
      } as unknown as Request;

      const res = mockResponse() as Response;

      await hierarchyController.getHierarchyTeamMemberList(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Current user information is required',
        }),
      );
    });

    it('should handle missing channel id in current user', async () => {
      const req = {
        query: { teamMembers: 'true' },
        headers: { currentuser: JSON.stringify({ id: mockUserId }) },
      } as unknown as Request;

      const res = mockResponse() as Response;

      await hierarchyController.getHierarchyTeamMemberList(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Channel ID and User ID are required',
        }),
      );
    });
  });

  describe('updateHierarchy', () => {
    const mockId = new Types.ObjectId().toString();
    const mockUpdateData = {
      hierarchyName: 'Updated Hierarchy',
      hierarchyStatus: 'inactive' as const,
    };

    it('should update hierarchy successfully', async () => {
      const mockUpdatedHierarchy = createMockHierarchyResponse({
        _id: mockId,
        ...mockUpdateData,
      });

      mockHierarchyService.updateHierarchy.mockResolvedValue(
        mockUpdatedHierarchy,
      );

      const req = mockRequest(mockUpdateData, { id: mockId }) as Request;
      const res = mockResponse() as Response;

      await hierarchyController.updateHierarchy(req, res);

      expect(mockHierarchyService.updateHierarchy).toHaveBeenCalledWith(
        mockId,
        mockUpdateData,
      );
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Hierarchy updated successfully',
          data: mockUpdatedHierarchy,
        }),
      );
    });

    it('should handle missing id parameter', async () => {
      const req = mockRequest(mockUpdateData, {}) as Request;
      const res = mockResponse() as Response;

      await hierarchyController.updateHierarchy(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Hierarchy ID is required',
        }),
      );
    });

    it('should handle empty update data', async () => {
      const req = mockRequest({}, { id: mockId }) as Request;
      const res = mockResponse() as Response;

      await hierarchyController.updateHierarchy(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'At least one field is required for update',
        }),
      );
    });

    it('should handle not found error', async () => {
      mockHierarchyService.updateHierarchy.mockResolvedValue(null);

      const req = mockRequest(mockUpdateData, { id: mockId }) as Request;
      const res = mockResponse() as Response;

      await hierarchyController.updateHierarchy(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Hierarchy not found',
        }),
      );
    });
  });
});
