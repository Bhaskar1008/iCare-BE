import { ChannelRepository } from '../channel.repository';
import * as dbHandler from 'tests/integration/setup';
import { generateObjectId } from 'tests/utils/test-utils';
import type { FilterQuery } from 'mongoose';
import type { IChannel } from '@/models/channel.model';

jest.setTimeout(120000);

describe('ChannelRepository', () => {
  let channelRepository: ChannelRepository;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterAll(async () => {
    try {
      await dbHandler.closeDatabase();
    } catch (_error) {
      // Silently handle error during cleanup
    }
  });

  afterEach(async () => {
    try {
      await dbHandler.clearDatabase();
    } catch (_error) {
      // Silently handle error during cleanup
    }
  });

  beforeEach(() => {
    channelRepository = new ChannelRepository();
  });

  describe('create', () => {
    it('should create a new channel in the database', async () => {
      const channelData = {
        channelName: 'Test Channel',
        channelCode: 'TEST001',
        channelStatus: 'active' as const,
      };

      const result = await channelRepository.create(channelData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.channelName).toBe(channelData.channelName);
      expect(result.channelCode).toBe(channelData.channelCode);
      expect(result.channelStatus).toBe(channelData.channelStatus);
    });
  });

  describe('findById', () => {
    it('should find a channel by ID', async () => {
      const channelData = {
        channelName: 'Test Channel',
        channelCode: 'TEST001',
        channelStatus: 'active' as const,
      };

      const createdChannel = await channelRepository.create(channelData);

      const foundChannel = await channelRepository.findById(
        String(createdChannel.id),
      );

      expect(foundChannel).toBeDefined();
      expect(foundChannel?.id).toBe(createdChannel.id);
      expect(foundChannel?.channelName).toBe(channelData.channelName);
    });

    it('should return null for non-existent ID', async () => {
      const nonExistentId = generateObjectId();

      const result = await channelRepository.findById(nonExistentId);

      expect(result).toBeNull();
    });
  });

  describe('find', () => {
    it('should return all channels', async () => {
      const channelData1 = {
        channelName: 'Test Channel 1',
        channelCode: 'TEST001',
        channelStatus: 'active' as const,
      };

      const channelData2 = {
        channelName: 'Test Channel 2',
        channelCode: 'TEST002',
        channelStatus: 'active' as const,
      };

      await channelRepository.create(channelData1);
      await channelRepository.create(channelData2);

      const channels = await channelRepository.find();

      expect(channels).toBeDefined();
      expect(Array.isArray(channels)).toBe(true);
      expect(channels.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('findByCode', () => {
    it('should find a channel by code', async () => {
      const channelData = {
        channelName: 'Test Channel',
        channelCode: 'TEST001',
        channelStatus: 'active' as const,
      };

      await channelRepository.create(channelData);

      const foundChannel = await channelRepository.findByCode(
        channelData.channelCode,
      );

      expect(foundChannel).toBeDefined();
      expect(foundChannel?.channelCode).toBe(channelData.channelCode);
      expect(foundChannel?.channelName).toBe(channelData.channelName);
    });

    it('should return null for non-existent code', async () => {
      const nonExistentCode = 'NONEXISTENT';

      const result = await channelRepository.findByCode(nonExistentCode);

      expect(result).toBeNull();
    });
  });

  describe('findActiveChannels', () => {
    it('should return only active channels', async () => {
      const activeChannelData = {
        channelName: 'Active Channel',
        channelCode: 'ACTIVE001',
        channelStatus: 'active' as const,
      };

      const inactiveChannelData = {
        channelName: 'Inactive Channel',
        channelCode: 'INACTIVE01',
        channelStatus: 'inactive' as const,
      };

      await channelRepository.create(activeChannelData);
      await channelRepository.create(inactiveChannelData);

      const activeChannels = await channelRepository.findActiveChannels();

      expect(activeChannels).toBeDefined();
      expect(Array.isArray(activeChannels)).toBe(true);

      expect(activeChannels.length).toBeGreaterThanOrEqual(1);
      expect(
        activeChannels.every(channel => channel.channelStatus === 'active'),
      ).toBe(true);

      const foundActiveChannel = activeChannels.find(
        channel => channel.channelCode === activeChannelData.channelCode,
      );
      expect(foundActiveChannel).toBeDefined();
    });
  });

  describe('findWithPagination', () => {
    it('should return paginated results', async () => {
      const channelsToCreate = Array.from({ length: 15 }, (_, i) => ({
        channelName: `Test Channel ${i + 1}`,
        channelCode: `TEST${String(i + 1).padStart(3, '0')}`,
        channelStatus: 'active' as const,
      }));

      for (const channelData of channelsToCreate) {
        await channelRepository.create(channelData);
      }

      const page1Result = await channelRepository.findWithPagination(
        {} as FilterQuery<IChannel>,
        1,
        5,
      );

      const page2Result = await channelRepository.findWithPagination(
        {} as FilterQuery<IChannel>,
        2,
        5,
      );

      expect(page1Result.total).toBeGreaterThanOrEqual(15);
      expect(page1Result.totalPages).toBeGreaterThanOrEqual(3);

      expect(page1Result.channels.length).toBe(5);
      expect(page2Result.channels.length).toBe(5);

      const page1Ids = page1Result.channels.map(channel => String(channel.id));
      const page2Ids = page2Result.channels.map(channel => String(channel.id));

      const intersection = page1Ids.filter(id => page2Ids.includes(id));
      expect(intersection.length).toBe(0);
    });

    it('should filter results correctly', async () => {
      const activeChannelData = {
        channelName: 'Active Test Channel',
        channelCode: 'ACTIVE001',
        channelStatus: 'active' as const,
      };

      const inactiveChannelData = {
        channelName: 'Inactive Test Channel',
        channelCode: 'INACTIVE01',
        channelStatus: 'inactive' as const,
      };

      await channelRepository.create(activeChannelData);
      await channelRepository.create(inactiveChannelData);

      const activeResults = await channelRepository.findWithPagination({
        channelStatus: 'active',
      } as FilterQuery<IChannel>);

      const inactiveResults = await channelRepository.findWithPagination({
        channelStatus: 'inactive',
      } as FilterQuery<IChannel>);

      expect(
        activeResults.channels.every(c => c.channelStatus === 'active'),
      ).toBe(true);
      expect(
        inactiveResults.channels.every(c => c.channelStatus === 'inactive'),
      ).toBe(true);

      expect(
        activeResults.channels.some(
          c => c.channelCode === activeChannelData.channelCode,
        ),
      ).toBe(true);

      expect(
        inactiveResults.channels.some(
          c => c.channelCode === inactiveChannelData.channelCode,
        ),
      ).toBe(true);
    });
  });
});
