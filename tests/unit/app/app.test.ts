import { App } from '@/app';
import { DatabaseProvider } from '@/providers/database.provider';
import type { Server } from 'http';
import MongoStore from 'connect-mongo';

// Mock mongoose to prevent real database operations
jest.mock('mongoose', () => ({
  ...jest.requireActual('mongoose'),
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  connection: {
    readyState: 1,
    close: jest.fn().mockResolvedValue(undefined),
    collections: {
      users: {
        deleteMany: jest.fn().mockResolvedValue(undefined),
      },
    },
  },
}));

jest.mock('@/providers/database.provider');
jest.mock('@/config/passport', () => ({
  configurePassport: jest.fn(),
}));
jest.mock('connect-mongo', () => {
  const mockStore = {
    close: jest.fn().mockResolvedValue(undefined),
  };
  return {
    create: jest.fn().mockReturnValue(mockStore),
  };
});

describe('App', () => {
  let app: App;
  let mockServer: Partial<Server>;
  const MockedDatabaseProvider = DatabaseProvider as jest.MockedClass<
    typeof DatabaseProvider
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.MOCK_MONGOOSE = 'true';
    delete process.env.MONGODB_URI;

    // Mock database provider methods
    MockedDatabaseProvider.prototype.connect.mockResolvedValue();
    MockedDatabaseProvider.prototype.disconnect.mockResolvedValue();
    MockedDatabaseProvider.prototype.isConnected.mockReturnValue(true);
    MockedDatabaseProvider.prototype.getHealth.mockReturnValue({
      status: 'connected',
      uptime: 1000,
      connections: { current: 1, available: 100 },
    });

    const config = {
      port: 3000,
      environment: 'test',
      database: {
        uri: 'mongodb://localhost:27017/test',
        dbName: 'test',
      },
      corsOrigin: '*',
    };
    app = new App(config);

    // Mock server
    mockServer = {
      close: jest.fn((cb?: (err?: Error) => void) => {
        if (cb) cb();
        return mockServer as Server;
      }),
      listening: true,
    };
    jest
      .spyOn(app.getApp(), 'listen')
      .mockImplementation((port: number, cb?: () => void) => {
        if (cb) cb();
        return mockServer as Server;
      });
  });

  afterEach(async () => {
    await app.stop();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    // Close any remaining connections
    const store = MongoStore.create({} as any);
    await store.close();
  });

  describe('initialization', () => {
    it('should initialize the app with default config', () => {
      expect(app.getApp()).toBeDefined();
      expect(MockedDatabaseProvider).toHaveBeenCalledTimes(1);
    });

    it('should initialize with custom cors origin', () => {
      const customConfig = {
        port: 3000,
        environment: 'test',
        database: {
          uri: 'mongodb://localhost:27017',
          dbName: 'test',
        },
        corsOrigin: ['http://localhost:3000'],
      };
      const customApp = new App(customConfig);
      expect(customApp.getApp()).toBeDefined();
    });
  });

  describe('database operations', () => {
    it('should connect to database on start', async () => {
      await app.start();
      expect(MockedDatabaseProvider.prototype.connect).toHaveBeenCalled();
      expect(app.getApp().listen).toHaveBeenCalled();
    });

    it('should handle database connection error', async () => {
      MockedDatabaseProvider.prototype.connect.mockRejectedValueOnce(
        new Error('Database connection failed'),
      );
      await expect(app.start()).rejects.toThrow('Database connection failed');
    });

    it('should disconnect from database on stop', async () => {
      // Start the server first
      await app.start();
      expect(app.getApp().listen).toHaveBeenCalled();

      // Then stop it
      await app.stop();
      expect(mockServer.close).toHaveBeenCalled();
      expect(MockedDatabaseProvider.prototype.disconnect).toHaveBeenCalled();
    });

    it('should return database provider instance', () => {
      const dbProvider = app.getDatabaseProvider();
      expect(dbProvider).toBeInstanceOf(DatabaseProvider);
    });
  });

  describe('environment handling', () => {
    it('should handle missing session secret', () => {
      delete process.env.SESSION_SECRET;
      const defaultApp = new App({
        port: 3000,
        environment: 'test',
        database: {
          uri: 'mongodb://localhost:27017/test',
          dbName: 'test',
        },
      });
      expect(defaultApp.getApp()).toBeDefined();
    });
  });
});
