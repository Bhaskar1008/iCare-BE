import { ChannelModel } from '@/models/channel.model';
import { Types } from 'mongoose';
import { VALIDATION } from '@/common/constants/http-status.constants';
import {
  setupTestDB,
  teardownTestDB,
  clearTestDB,
} from '../../models/__tests__/setup';

describe('ChannelModel', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  describe('schema validation', () => {
    it('should create a valid channel', () => {
      const validChannel = new ChannelModel({
        channelName: 'Test Channel',
        channelCode: 'TEST_CHAN',
        channelStatus: 'active',
        projectId: new Types.ObjectId(),
      });

      const validationError = validChannel.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('should require channelName', () => {
      const invalidChannel = new ChannelModel({
        channelCode: 'TEST_CHANNEL',
        channelStatus: 'active',
        projectId: new Types.ObjectId(),
      });

      const validationError = invalidChannel.validateSync();
      expect(validationError?.errors.channelName).toBeDefined();
      expect(validationError?.errors.channelName.message).toBe(
        'Channel name is required',
      );
    });

    it('should require channelCode', () => {
      const invalidChannel = new ChannelModel({
        channelName: 'Test Channel',
        channelStatus: 'active',
        projectId: new Types.ObjectId(),
      });

      const validationError = invalidChannel.validateSync();
      expect(validationError?.errors.channelCode).toBeDefined();
      expect(validationError?.errors.channelCode.message).toBe(
        'Channel code is required',
      );
    });

    it('should require projectId', () => {
      const invalidChannel = new ChannelModel({
        channelName: 'Test Channel',
        channelCode: 'TEST_CHAN',
        channelStatus: 'active',
      });

      const validationError = invalidChannel.validateSync();
      expect(validationError?.errors.projectId).toBeDefined();
      expect(validationError?.errors.projectId.message).toBe(
        'Project ID is required',
      );
    });

    it('should set default values correctly', () => {
      const channel = new ChannelModel({
        channelName: 'Test Channel',
        channelCode: 'TEST_CHAN',
        projectId: new Types.ObjectId(),
      });

      expect(channel.isDeleted).toBe(false);
      expect(channel.deletedAt).toBeNull();
      expect(channel.channelStatus).toBe('active');
    });

    it('should validate channelCode format', () => {
      const invalidChannel = new ChannelModel({
        channelName: 'Test Channel',
        channelCode: 'invalid code',
        channelStatus: 'active',
        projectId: new Types.ObjectId(),
      });

      const validationError = invalidChannel.validateSync();
      expect(validationError?.errors.channelCode).toBeDefined();
      expect(validationError?.errors.channelCode.message).toBe(
        'Channel code cannot exceed 10 characters',
      );
    });

    it('should validate channelStatus values', () => {
      const invalidChannel = new ChannelModel({
        channelName: 'Test Channel',
        channelCode: 'TEST_CHAN',
        channelStatus: 'invalid',
        projectId: new Types.ObjectId(),
      });

      const validationError = invalidChannel.validateSync();
      expect(validationError?.errors.channelStatus).toBeDefined();
      expect(validationError?.errors.channelStatus.message).toBe(
        'Status must be either active or inactive',
      );
    });

    it('should enforce maximum length for channelName', () => {
      const invalidChannel = new ChannelModel({
        channelName: 'a'.repeat(VALIDATION.MAX_NAME_LENGTH + 1),
        channelCode: 'TEST_CHAN',
        channelStatus: 'active',
        projectId: new Types.ObjectId(),
      });

      const validationError = invalidChannel.validateSync();
      expect(validationError?.errors.channelName).toBeDefined();
      expect(validationError?.errors.channelName.message).toBe(
        `Channel name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
      );
    });

    it('should enforce maximum length for channelCode', () => {
      const invalidChannel = new ChannelModel({
        channelName: 'Test Channel',
        channelCode: 'A'.repeat(VALIDATION.MAX_CODE_LENGTH + 1),
        channelStatus: 'active',
        projectId: new Types.ObjectId(),
      });

      const validationError = invalidChannel.validateSync();
      expect(validationError?.errors.channelCode).toBeDefined();
      expect(validationError?.errors.channelCode.message).toBe(
        `Channel code cannot exceed ${VALIDATION.MAX_CODE_LENGTH} characters`,
      );
    });
  });
});
