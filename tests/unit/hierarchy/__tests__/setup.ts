import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { ChannelModel } from '@/models/channel.model';
import { AgentModel } from '@/models/agent.model';
import { DesignationModel } from '@/models/designation.model';
import { HierarchyModel } from '@/models/hierarchy.model';

let mongoServer: MongoMemoryServer;

// Create mock functions for logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: jest.fn().mockReturnThis(),
  http: jest.fn(),
};

// Mock all external dependencies
export const mockDependencies = () => {
  // Mock logger
  jest.mock('@/common/utils/logger', () => ({
    __esModule: true,
    default: mockLogger,
    createChildLogger: jest.fn().mockReturnValue(mockLogger),
    stream: {
      write: jest.fn(),
    },
  }));

  // Mock models
  jest.mock('@/models/channel.model', () => ({
    ChannelModel: {
      findById: jest.fn().mockResolvedValue({ isDeleted: false }),
    },
  }));

  jest.mock('@/models/agent.model', () => ({
    AgentModel: {
      findOne: jest.fn().mockResolvedValue(null),
      aggregate: jest.fn().mockResolvedValue([]),
    },
  }));

  jest.mock('@/models/designation.model', () => ({
    DesignationModel: {
      findOne: jest.fn().mockResolvedValue(null),
      aggregate: jest.fn().mockResolvedValue([]),
    },
  }));

  jest.mock('@/models/hierarchy.model', () => ({
    HierarchyModel: {
      findOne: jest.fn().mockResolvedValue(null),
      aggregate: jest.fn().mockResolvedValue([]),
    },
  }));

  // Mock repository
  jest.mock('@/modules/hierarchy/hierarchy.repository');
};

export const setupTestDB = async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
};

export const teardownTestDB = async () => {
  try {
    await mongoose.disconnect();
    await mongoServer.stop();
  } catch (error) {
    console.error('Error tearing down test database:', error);
    throw error;
  }
};

export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

// Clear all mocks between tests
export const clearMocks = () => {
  jest.clearAllMocks();

  // Clear specific mocks
  mockLogger.debug.mockClear();
  mockLogger.info.mockClear();
  mockLogger.warn.mockClear();
  mockLogger.error.mockClear();
  mockLogger.child.mockClear();
  mockLogger.http.mockClear();

  (ChannelModel.findById as jest.Mock).mockClear();

  (AgentModel.findOne as jest.Mock).mockClear();
  (AgentModel.aggregate as jest.Mock).mockClear();

  (DesignationModel.findOne as jest.Mock).mockClear();
  (DesignationModel.aggregate as jest.Mock).mockClear();

  (HierarchyModel.findOne as jest.Mock).mockClear();
  (HierarchyModel.aggregate as jest.Mock).mockClear();
};
