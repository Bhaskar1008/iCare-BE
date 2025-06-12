import { ChannelService } from '../channel.service';
import type { ChannelRepository } from '../channel.repository';
import { generateObjectId } from 'tests/utils/test-utils';
import type { IChannel } from '@/models/channel.model';
import { DatabaseValidationException } from '@/common/exceptions/database.exception';

jest.mock('../channel.repository');

describe('ChannelService', () => {
  let channelService: ChannelService;
  let mockChannelRepository: jest.Mocked<ChannelRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    const repository: Partial<ChannelRepository> = {
      create: jest.fn((_data: Partial<IChannel>) =>
        Promise.resolve({} as IChannel),
      ),
      findById: jest.fn((_id: string) => Promise.resolve(null)),
      findByCode: jest.fn((_code: string) => Promise.resolve(null)),
      find: jest.fn((_filter: any) => Promise.resolve([] as IChannel[])),
      findActiveChannels: jest.fn(() => Promise.resolve([] as IChannel[])),
      findWithPagination: jest.fn(
        (_filter?: any, _page?: number, _limit?: number) =>
          Promise.resolve({
            channels: [] as IChannel[],
            total: 0,
            totalPages: 0,
          }),
      ),
      findOne: jest.fn((_filter: any) => Promise.resolve(null)),
      updateById: jest.fn((_id: string, _data: Partial<IChannel>) =>
        Promise.resolve({} as IChannel),
      ),
      deleteById: jest.fn((_id: string) => Promise.resolve(null)),
      count: jest.fn((_filter: any) => Promise.resolve(0)),
      exists: jest.fn((_filter: any) => Promise.resolve(false)),
    };

    mockChannelRepository = repository as jest.Mocked<ChannelRepository>;

    mockChannelRepository.create = jest.fn((_data: Partial<IChannel>) =>
      Promise.resolve({} as IChannel),
    );
    mockChannelRepository.findById = jest.fn((_id: string) =>
      Promise.resolve(null),
    );
    mockChannelRepository.findByCode = jest.fn((_code: string) =>
      Promise.resolve(null),
    );
    mockChannelRepository.find = jest.fn((_filter: any) =>
      Promise.resolve([] as IChannel[]),
    );
    mockChannelRepository.findActiveChannels = jest.fn(() =>
      Promise.resolve([] as IChannel[]),
    );
    mockChannelRepository.findWithPagination = jest.fn(
      (_filter?: any, _page?: number, _limit?: number) =>
        Promise.resolve({
          channels: [] as IChannel[],
          total: 0,
          totalPages: 0,
        }),
    );

    channelService = new ChannelService();
    (channelService as any).channelRepository = mockChannelRepository;
  });

  describe('createChannel', () => {
    it('should create a new channel', async () => {
      const channelData = {
        channelName: 'Test Channel',
        channelCode: 'TEST001',
      };

      const createdChannel = {
        channelName: 'Test Channel',
        channelCode: 'TEST001',
      } as IChannel;

      mockChannelRepository.findByCode = jest.fn((_code: string) =>
        Promise.resolve(null),
      );
      mockChannelRepository.create = jest.fn((_data: Partial<IChannel>) =>
        Promise.resolve(createdChannel),
      );

      const result = await channelService.createChannel(channelData);

      expect(mockChannelRepository.findByCode).toHaveBeenCalledWith('TEST001');
      expect(mockChannelRepository.create).toHaveBeenCalledWith({
        ...channelData,
        channelStatus: 'active',
      });
      expect(result).toEqual(createdChannel);
    });

    it('should throw an error if channel code already exists', async () => {
      const channelData = {
        channelName: 'Test Channel',
        channelCode: 'TEST001',
      };

      const existingChannel = {
        id: '123',
        channelName: 'Existing Channel',
        channelCode: 'TEST001',
      } as IChannel;

      mockChannelRepository.findByCode = jest.fn((_code: string) =>
        Promise.resolve(existingChannel),
      );

      await expect(channelService.createChannel(channelData)).rejects.toThrow(
        DatabaseValidationException,
      );
      expect(mockChannelRepository.findByCode).toHaveBeenCalledWith('TEST001');
      expect(mockChannelRepository.create).not.toHaveBeenCalled();
    });

    it('should throw an error when repository fails', async () => {
      const channelData = {
        channelName: 'Test Channel',
        channelCode: 'TEST001',
        channelStatus: 'active' as const,
      };

      const error = new Error('Database error');
      mockChannelRepository.findByCode.mockImplementation((_code: string) =>
        Promise.resolve(null),
      );
      mockChannelRepository.create = jest.fn((_data: Partial<IChannel>) =>
        Promise.reject(error),
      );

      await expect(channelService.createChannel(channelData)).rejects.toThrow(
        'Database error',
      );
      expect(mockChannelRepository.findByCode).toHaveBeenCalledWith(
        channelData.channelCode,
      );
      expect(mockChannelRepository.create).toHaveBeenCalled();
    });
  });

  describe('getChannelById', () => {
    it('should return a channel when it exists', async () => {
      const channelId = generateObjectId();
      const channel = {
        _id: channelId,
        channelName: 'Test Channel',
        channelCode: 'TEST001',
        channelStatus: 'active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as IChannel;

      mockChannelRepository.findById = jest.fn((_id: string) =>
        Promise.resolve(channel),
      );

      const result = await channelService.getChannelById(channelId);

      expect(mockChannelRepository.findById).toHaveBeenCalledWith(channelId);
      expect(result).toEqual(
        expect.objectContaining({
          _id: channel._id,
          channelName: channel.channelName,
          channelCode: channel.channelCode,
        }),
      );
    });

    it('should return null when channel does not exist', async () => {
      const channelId = generateObjectId();
      mockChannelRepository.findById = jest.fn((_id: string) =>
        Promise.resolve(null),
      );

      const result = await channelService.getChannelById(channelId);

      expect(mockChannelRepository.findById).toHaveBeenCalledWith(channelId);
      expect(result).toBeNull();
    });

    it('should return null when channel is deleted', async () => {
      const channelId = generateObjectId();
      const channel = {
        _id: channelId,
        channelName: 'Test Channel',
        channelCode: 'TEST001',
        channelStatus: 'active',
        isDeleted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as IChannel;

      mockChannelRepository.findById = jest.fn((_id: string) =>
        Promise.resolve(channel),
      );

      const result = await channelService.getChannelById(channelId);

      expect(mockChannelRepository.findById).toHaveBeenCalledWith(channelId);
      expect(result).toBeNull();
    });

    it('should throw an error when repository fails', async () => {
      const channelId = generateObjectId();
      const error = new Error('Database error');
      mockChannelRepository.findById = jest.fn((_id: string) =>
        Promise.reject(error),
      );

      await expect(channelService.getChannelById(channelId)).rejects.toThrow(
        'Database error',
      );
      expect(mockChannelRepository.findById).toHaveBeenCalledWith(channelId);
    });
  });

  describe('getChannelByCode', () => {
    it('should return a channel when it exists', async () => {
      const channelCode = 'TEST001';
      const channel = {
        _id: generateObjectId(),
        channelName: 'Test Channel',
        channelCode,
        channelStatus: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as IChannel;

      mockChannelRepository.findByCode = jest.fn((_code: string) =>
        Promise.resolve(channel),
      );

      const result = await channelService.getChannelByCode(channelCode);

      expect(mockChannelRepository.findByCode).toHaveBeenCalledWith(
        channelCode,
      );
      expect(result).toEqual(
        expect.objectContaining({
          _id: channel._id,
          channelName: channel.channelName,
          channelCode: channel.channelCode,
        }),
      );
    });

    it('should return null when channel does not exist', async () => {
      const channelCode = 'NONEXISTENT';
      mockChannelRepository.findByCode = jest.fn((_code: string) =>
        Promise.resolve(null),
      );

      const result = await channelService.getChannelByCode(channelCode);

      expect(mockChannelRepository.findByCode).toHaveBeenCalledWith(
        channelCode,
      );
      expect(result).toBeNull();
    });

    it('should throw an error when repository fails', async () => {
      const channelCode = 'TEST001';
      const error = new Error('Database error');
      mockChannelRepository.findByCode = jest.fn((_code: string) =>
        Promise.reject(error),
      );

      await expect(
        channelService.getChannelByCode(channelCode),
      ).rejects.toThrow('Database error');
      expect(mockChannelRepository.findByCode).toHaveBeenCalledWith(
        channelCode,
      );
    });
  });

  describe('getAllChannels', () => {
    it('should return paginated channels', async () => {
      const page = 2;
      const limit = 10;

      const channels = Array.from({ length: 5 }, (_, i) => ({
        _id: generateObjectId(),
        channelName: `Test Channel ${i + 1}`,
        channelCode: `TEST00${i + 1}`,
        channelStatus: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      })) as IChannel[];

      const paginationResult = {
        channels,
        total: 25,
        totalPages: 3,
      };

      mockChannelRepository.findWithPagination = jest.fn(() =>
        Promise.resolve(paginationResult),
      );

      const result = await channelService.getAllChannels(page, limit);

      expect(mockChannelRepository.findWithPagination).toHaveBeenCalledWith(
        {},
        page,
        limit,
      );
      expect(result.channels).toHaveLength(channels.length);
      expect(result.pagination).toEqual({
        page,
        limit,
        total: paginationResult.total,
        totalPages: paginationResult.totalPages,
      });
    });

    it('should filter channels by status when provided', async () => {
      const page = 1;
      const limit = 10;
      const status = 'active' as const;

      const channels = Array.from({ length: 3 }, (_, i) => ({
        _id: generateObjectId(),
        channelName: `Active Channel ${i + 1}`,
        channelCode: `ACT00${i + 1}`,
        channelStatus: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      })) as IChannel[];

      const paginationResult = {
        channels,
        total: 3,
        totalPages: 1,
      };

      mockChannelRepository.findWithPagination = jest.fn(() =>
        Promise.resolve(paginationResult),
      );

      const result = await channelService.getAllChannels(page, limit, status);

      expect(mockChannelRepository.findWithPagination).toHaveBeenCalledWith(
        { channelStatus: status },
        page,
        limit,
      );
      expect(result.channels).toHaveLength(channels.length);
      expect(result.pagination.total).toBe(paginationResult.total);
    });

    it('should throw an error when repository fails', async () => {
      const page = 1;
      const limit = 10;
      const error = new Error('Database error');
      mockChannelRepository.findWithPagination = jest.fn(() =>
        Promise.reject(error),
      );

      await expect(channelService.getAllChannels(page, limit)).rejects.toThrow(
        'Database error',
      );
      expect(mockChannelRepository.findWithPagination).toHaveBeenCalled();
    });
  });

  describe('getActiveChannels', () => {
    it('should return only active channels', async () => {
      const activeChannels = Array.from({ length: 3 }, (_, i) => ({
        _id: generateObjectId(),
        channelName: `Active Channel ${i + 1}`,
        channelCode: `ACT00${i + 1}`,
        channelStatus: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      })) as IChannel[];

      mockChannelRepository.findActiveChannels = jest.fn(() =>
        Promise.resolve(activeChannels),
      );

      const result = await channelService.getActiveChannels();

      expect(mockChannelRepository.findActiveChannels).toHaveBeenCalled();
      expect(result).toHaveLength(activeChannels.length);
      expect(result[0]).toEqual(
        expect.objectContaining({
          _id: activeChannels[0]._id,
          channelName: activeChannels[0].channelName,
          channelCode: activeChannels[0].channelCode,
          channelStatus: 'active',
        }),
      );
    });

    it('should throw an error when repository fails', async () => {
      const error = new Error('Database error');
      mockChannelRepository.findActiveChannels = jest.fn(() =>
        Promise.reject(error),
      );

      await expect(channelService.getActiveChannels()).rejects.toThrow(
        'Database error',
      );
      expect(mockChannelRepository.findActiveChannels).toHaveBeenCalled();
    });
  });
});
