import { ChannelController } from '../channel.controller';
import type { ChannelService } from '../channel.service';
import { mockRequest, createMockService } from 'tests/utils/test-utils';
import type { Request, Response } from 'express';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';

jest.mock('../channel.service');

describe('ChannelController', () => {
  let channelController: ChannelController;
  let mockChannelService: jest.Mocked<ChannelService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockChannelService = createMockService() as any;

    mockChannelService.createChannel = jest.fn();
    mockChannelService.getChannelById = jest.fn();
    mockChannelService.getChannelByCode = jest.fn();
    mockChannelService.getAllChannels = jest.fn();
    mockChannelService.getActiveChannels = jest.fn();

    channelController = new ChannelController();
    (channelController as any).channelService = mockChannelService;
  });

  describe('createChannel', () => {
    it('should create a new channel and return 201 status', async () => {
      const channelData = {
        name: 'Test Channel',
        description: 'Test Description',
      };

      const createdChannel = {
        id: '123',
        name: 'Test Channel',
        description: 'Test Description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChannelService.createChannel = jest
        .fn()
        .mockResolvedValue(createdChannel);

      const req = mockRequest(channelData) as unknown as Request;
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(() => res),
      } as unknown as Response;

      await channelController.createChannel(req, res);

      expect(mockChannelService.createChannel).toHaveBeenCalledWith(
        channelData,
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: createdChannel,
        }),
      );
    });

    it('should handle errors during channel creation', async () => {
      const error = new Error('Failed to create channel');
      mockChannelService.createChannel = jest.fn().mockRejectedValue(error);

      const req = mockRequest({ name: 'Test Channel' }) as unknown as Request;
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(() => res),
      } as unknown as Response;

      await channelController.createChannel(req, res);

      expect(mockChannelService.createChannel).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to create channel',
        }),
      );
    });

    it('should handle database validation errors during channel creation', async () => {
      const error = new DatabaseValidationException(
        'Channel code already exists',
      );
      mockChannelService.createChannel = jest.fn().mockRejectedValue(error);

      const req = mockRequest({
        name: 'Test Channel',
        channelCode: 'TEST001',
      }) as unknown as Request;
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(() => res),
      } as unknown as Response;

      await channelController.createChannel(req, res);

      expect(mockChannelService.createChannel).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Channel code already exists',
        }),
      );
    });
  });

  describe('getChannelById', () => {
    it('should return a channel when it exists', async () => {
      const channelId = '123';
      const channel = {
        id: channelId,
        name: 'Test Channel',
        description: 'Test Description',
      };

      mockChannelService.getChannelById = jest.fn().mockResolvedValue(channel);

      const req = mockRequest({}, { id: channelId }) as unknown as Request;
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(() => res),
      } as unknown as Response;

      await channelController.getChannelById(req, res);

      expect(mockChannelService.getChannelById).toHaveBeenCalledWith(channelId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: channel,
        }),
      );
    });

    it('should return 404 when channel does not exist', async () => {
      const channelId = '123';
      mockChannelService.getChannelById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({}, { id: channelId }) as unknown as Request;
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(() => res),
      } as unknown as Response;

      await channelController.getChannelById(req, res);

      expect(mockChannelService.getChannelById).toHaveBeenCalledWith(channelId);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Channel not found',
        }),
      );
    });

    it('should return 400 when channel id is not provided', async () => {
      const req = mockRequest({}, {}) as unknown as Request;
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(() => res),
      } as unknown as Response;

      await channelController.getChannelById(req, res);

      expect(mockChannelService.getChannelById).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Channel ID is required',
        }),
      );
    });

    it('should handle errors when getting channel by id', async () => {
      const channelId = '123';
      const error = new Error('Database error');
      mockChannelService.getChannelById = jest.fn().mockRejectedValue(error);

      const req = mockRequest({}, { id: channelId }) as unknown as Request;
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(() => res),
      } as unknown as Response;

      await channelController.getChannelById(req, res);

      expect(mockChannelService.getChannelById).toHaveBeenCalledWith(channelId);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to retrieve channel',
        }),
      );
    });
  });

  describe('getChannelByCode', () => {
    it('should return a channel when it exists', async () => {
      const channelCode = 'TEST001';
      const channel = {
        id: '123',
        channelName: 'Test Channel',
        channelCode,
      };

      mockChannelService.getChannelByCode = jest
        .fn()
        .mockResolvedValue(channel);

      const req = mockRequest({}, { code: channelCode }) as unknown as Request;
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(() => res),
      } as unknown as Response;

      await channelController.getChannelByCode(req, res);

      expect(mockChannelService.getChannelByCode).toHaveBeenCalledWith(
        channelCode,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: channel,
        }),
      );
    });

    it('should return 404 when channel does not exist', async () => {
      const channelCode = 'NONEXISTENT';
      mockChannelService.getChannelByCode = jest.fn().mockResolvedValue(null);

      const req = mockRequest({}, { code: channelCode }) as unknown as Request;
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(() => res),
      } as unknown as Response;

      await channelController.getChannelByCode(req, res);

      expect(mockChannelService.getChannelByCode).toHaveBeenCalledWith(
        channelCode,
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Channel not found',
        }),
      );
    });

    it('should return 400 when channel code is not provided', async () => {
      const req = mockRequest({}, {}) as unknown as Request;
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(() => res),
      } as unknown as Response;

      await channelController.getChannelByCode(req, res);

      expect(mockChannelService.getChannelByCode).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Channel code is required',
        }),
      );
    });

    it('should handle errors when getting channel by code', async () => {
      const channelCode = 'TEST001';
      const error = new Error('Database error');
      mockChannelService.getChannelByCode = jest.fn().mockRejectedValue(error);

      const req = mockRequest({}, { code: channelCode }) as unknown as Request;
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(() => res),
      } as unknown as Response;

      await channelController.getChannelByCode(req, res);

      expect(mockChannelService.getChannelByCode).toHaveBeenCalledWith(
        channelCode,
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to retrieve channel',
        }),
      );
    });
  });

  describe('getAllChannels', () => {
    it('should return all channels with pagination', async () => {
      const paginationResult = {
        channels: [
          { id: '1', name: 'Channel 1' },
          { id: '2', name: 'Channel 2' },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      };

      mockChannelService.getAllChannels = jest
        .fn()
        .mockResolvedValue(paginationResult);

      const req = mockRequest(
        {},
        {},
        { page: '1', limit: '10' },
      ) as unknown as Request;
      (req as any).validatedQuery = { page: '1', limit: '10' };

      const res = {
        status: jest.fn(() => res),
        json: jest.fn(() => res),
      } as unknown as Response;

      await channelController.getAllChannels(req, res);

      expect(mockChannelService.getAllChannels).toHaveBeenCalledWith(
        1,
        10,
        undefined,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: paginationResult,
        }),
      );
    });

    it('should return filtered channels when status is provided', async () => {
      const paginationResult = {
        channels: [{ id: '1', name: 'Active Channel', status: 'active' }],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockChannelService.getAllChannels = jest
        .fn()
        .mockResolvedValue(paginationResult);

      const req = mockRequest(
        {},
        {},
        { page: '1', limit: '10', status: 'active' },
      ) as unknown as Request;
      (req as any).validatedQuery = {
        page: '1',
        limit: '10',
        status: 'active',
      };

      const res = {
        status: jest.fn(() => res),
        json: jest.fn(() => res),
      } as unknown as Response;

      await channelController.getAllChannels(req, res);

      expect(mockChannelService.getAllChannels).toHaveBeenCalledWith(
        1,
        10,
        'active',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: paginationResult,
        }),
      );
    });

    it('should handle errors when getting all channels', async () => {
      const error = new Error('Database error');
      mockChannelService.getAllChannels = jest.fn().mockRejectedValue(error);

      const req = mockRequest(
        {},
        {},
        { page: '1', limit: '10' },
      ) as unknown as Request;
      (req as any).validatedQuery = { page: '1', limit: '10' };

      const res = {
        status: jest.fn(() => res),
        json: jest.fn(() => res),
      } as unknown as Response;

      await channelController.getAllChannels(req, res);

      expect(mockChannelService.getAllChannels).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to retrieve channels',
        }),
      );
    });
  });

  describe('getActiveChannels', () => {
    it('should return only active channels', async () => {
      const activeChannels = [
        { id: '1', name: 'Active Channel 1', status: 'active' },
        { id: '2', name: 'Active Channel 2', status: 'active' },
      ];

      mockChannelService.getActiveChannels = jest
        .fn()
        .mockResolvedValue(activeChannels);

      const req = mockRequest() as unknown as Request;
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(() => res),
      } as unknown as Response;

      await channelController.getActiveChannels(req, res);

      expect(mockChannelService.getActiveChannels).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: activeChannels,
        }),
      );
    });

    it('should handle errors when getting active channels', async () => {
      const error = new Error('Database error');
      mockChannelService.getActiveChannels = jest.fn().mockRejectedValue(error);

      const req = mockRequest() as unknown as Request;
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(() => res),
      } as unknown as Response;

      await channelController.getActiveChannels(req, res);

      expect(mockChannelService.getActiveChannels).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to retrieve active channels',
        }),
      );
    });
  });
});
