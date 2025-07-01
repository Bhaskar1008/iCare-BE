import { Router } from 'express';
import { ValidationPipe } from '@/common/pipes/validation.pipe';

// Create mock functions for the router
const mockRouterInstance = {
  get: jest.fn().mockReturnThis(),
  post: jest.fn().mockReturnThis(),
  put: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
};

// Mock the express Router
jest.mock('express', () => ({
  Router: jest.fn(() => mockRouterInstance),
}));

// Mock the hierarchy controller
jest.mock('@/modules/hierarchy/hierarchy.controller', () => ({
  HierarchyController: jest.fn().mockImplementation(() => ({
    createHierarchy: jest.fn().mockName('bound createHierarchy'),
    getHierarchyById: jest.fn().mockName('bound getHierarchyById'),
    getHierarchiesByChannel: jest
      .fn()
      .mockName('bound getHierarchiesByChannel'),
    getHierarchiesByChannelAndLevel: jest
      .fn()
      .mockName('bound getHierarchiesByChannelAndLevel'),
    getRootHierarchies: jest.fn().mockName('bound getRootHierarchies'),
    getChildHierarchies: jest.fn().mockName('bound getChildHierarchies'),
    getAllHierarchies: jest.fn().mockName('bound getAllHierarchies'),
    getHierarchyTeamMemberList: jest
      .fn()
      .mockName('bound getHierarchyTeamMemberList'),
    updateHierarchy: jest.fn().mockName('bound updateHierarchy'),
    deleteHierarchy: jest.fn().mockName('bound deleteHierarchy'),
    getHierarchyByAgentId: jest.fn().mockName('bound getHierarchyByAgentId'),
    getAgentsByHierarchyDesignation: jest
      .fn()
      .mockName('bound getAgentsByHierarchyDesignation'),
  })),
}));

// Mock the validation pipe
jest.mock('@/common/pipes/validation.pipe', () => ({
  ValidationPipe: {
    validateBody: jest.fn().mockReturnValue(jest.fn()),
    validateQuery: jest.fn().mockReturnValue(jest.fn()),
  },
}));

// Mock the logger
jest.mock('@/common/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('Hierarchy Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/modules/hierarchy/hierarchy.routes');
    });
  });

  it('should configure routes correctly', () => {
    // POST routes
    expect(mockRouterInstance.post).toHaveBeenCalledWith(
      '/',
      expect.any(Function),
      expect.any(Function),
    );

    // GET routes
    expect(mockRouterInstance.get).toHaveBeenCalledWith(
      '/',
      expect.any(Function),
      expect.any(Function),
    );

    expect(mockRouterInstance.get).toHaveBeenCalledWith(
      '/hierarchyTeamMemberList',
      expect.any(Function),
    );

    expect(mockRouterInstance.get).toHaveBeenCalledWith(
      '/:id',
      expect.any(Function),
    );

    expect(mockRouterInstance.get).toHaveBeenCalledWith(
      '/channel/:channelId',
      expect.any(Function),
    );

    expect(mockRouterInstance.get).toHaveBeenCalledWith(
      '/channel/:channelId/level',
      expect.any(Function),
    );

    expect(mockRouterInstance.get).toHaveBeenCalledWith(
      '/channel/:channelId/roots',
      expect.any(Function),
    );

    expect(mockRouterInstance.get).toHaveBeenCalledWith(
      '/parent/:parentId/children',
      expect.any(Function),
    );

    expect(mockRouterInstance.get).toHaveBeenCalledWith(
      '/agent/:agentId',
      expect.any(Function),
    );

    expect(mockRouterInstance.get).toHaveBeenCalledWith(
      '/channel/:channelId/designation',
      expect.any(Function),
      expect.any(Function),
    );

    // PUT routes
    expect(mockRouterInstance.put).toHaveBeenCalledWith(
      '/:id',
      expect.any(Function),
      expect.any(Function),
    );

    // DELETE routes
    expect(mockRouterInstance.delete).toHaveBeenCalledWith(
      '/:id',
      expect.any(Function),
    );
  });

  it('should use validation middleware correctly', () => {
    // Check that validateBody and validateQuery were called
    expect(ValidationPipe.validateBody).toHaveBeenCalled();
    expect(ValidationPipe.validateQuery).toHaveBeenCalled();

    // We can't check the exact arguments because of how isolateModules works,
    // but we can check the number of calls
    expect(ValidationPipe.validateBody).toHaveBeenCalledTimes(2); // POST / and PUT /:id
    expect(ValidationPipe.validateQuery).toHaveBeenCalledTimes(2); // GET / and GET /channel/:channelId/designation
  });

  it('should bind controller methods to routes', () => {
    // Verify the routes were set up
    expect(mockRouterInstance.post).toHaveBeenCalled();
    expect(mockRouterInstance.get).toHaveBeenCalled();
    expect(mockRouterInstance.put).toHaveBeenCalled();
    expect(mockRouterInstance.delete).toHaveBeenCalled();

    // Verify Router was initialized
    expect(Router).toHaveBeenCalled();
  });
});
