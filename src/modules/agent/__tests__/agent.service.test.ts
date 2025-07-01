/**
 * @jest-environment node
 * @jest-setupFiles []
 */

import { AgentService } from '@/modules/agent/agent.service';
import { DatabaseException } from '@/common/exceptions/database.exception';
import type mongoose from 'mongoose';
import { Types } from 'mongoose';

// Mock mongoose itself to prevent any database connections
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  const mockModel = {
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
      exec: jest.fn().mockResolvedValue([]),
    }),
    findById: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
      exec: jest.fn().mockResolvedValue(null),
    }),
    findOne: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
      exec: jest.fn().mockResolvedValue(null),
    }),
    create: jest.fn().mockResolvedValue({}),
    updateOne: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  };

  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue({}),
    connection: {
      on: jest.fn(),
      once: jest.fn(),
      readyState: 1, // Connected state
    },
    model: jest.fn(() => mockModel),
    Schema: actualMongoose.Schema,
    Types: actualMongoose.Types,
  } as unknown as typeof mongoose;
});

// Mock mongoose models to prevent database operations
jest.mock('@/models/agent.model', () => ({
  AgentModel: {
    findById: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    updateOne: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  },
}));

jest.mock('@/models/user.model', () => ({
  UserModel: {
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockResolvedValue([]),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  },
}));

jest.mock('@/models/hierarchy.model', () => ({
  HierarchyModel: {
    find: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  },
}));

jest.mock('@/models/designation.model', () => ({
  DesignationModel: {
    find: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  },
}));

// Mock all dependencies with proper constructor mocking
const mockFindById = jest.fn();
const mockFindAgentsByDesignationAndChannel = jest.fn();
const mockGetHierarchiesByChannel = jest.fn();
const mockGetHierarchyById = jest.fn();
const mockGetDesignationById = jest.fn();
const mockGetDesignationsByHierarchyId = jest.fn();
const mockCreate = jest.fn();
const mockFindByCode = jest.fn();
const mockFindWithPagination = jest.fn();
const mockFindActiveAgents = jest.fn();
const mockFindAgentsByChannelId = jest.fn();
const mockFindAgentsByProjectId = jest.fn();
const mockFindAgentsByUserId = jest.fn();

jest.mock('@/modules/agent/agent.repository', () => ({
  AgentRepository: jest.fn().mockImplementation(() => ({
    findById: mockFindById,
    findByCode: mockFindByCode,
    findWithPagination: mockFindWithPagination,
    findActiveAgents: mockFindActiveAgents,
    findAgentsByChannelId: mockFindAgentsByChannelId,
    findAgentsByProjectId: mockFindAgentsByProjectId,
    findAgentsByUserId: mockFindAgentsByUserId,
    findAgentsByDesignationAndChannel: mockFindAgentsByDesignationAndChannel,
    create: mockCreate,
  })),
}));

jest.mock('@/modules/hierarchy/hierarchy.service', () => ({
  HierarchyService: jest.fn().mockImplementation(() => ({
    getHierarchiesByChannel: mockGetHierarchiesByChannel,
    getHierarchyById: mockGetHierarchyById,
  })),
}));

jest.mock('@/modules/designation/designation.service', () => ({
  DesignationService: jest.fn().mockImplementation(() => ({
    getDesignationById: mockGetDesignationById,
    getDesignationsByHierarchyId: mockGetDesignationsByHierarchyId,
  })),
}));

jest.mock('@/modules/hierarchy/hierarchy.repository', () => ({
  HierarchyRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@/common/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock database connection to prevent any database operations
jest.mock('@/providers/database.provider', () => ({
  connectToDatabase: jest.fn().mockResolvedValue({}),
}));

// Mock any other utilities that might connect to database
jest.mock('@/modules/agent/utils/agent-code-generator', () => ({
  generateAgentCode: jest.fn().mockResolvedValue('AGT001'),
  isAgentCodeUnique: jest.fn().mockResolvedValue(true),
}));

// Import the mocked functions
import {
  generateAgentCode,
  isAgentCodeUnique,
} from '@/modules/agent/utils/agent-code-generator';
import { UserModel } from '@/models/user.model';

// Type assertion to access jest methods
const mockGenerateAgentCode = generateAgentCode as jest.MockedFunction<
  typeof generateAgentCode
>;
const mockIsAgentCodeUnique = isAgentCodeUnique as jest.MockedFunction<
  typeof isAgentCodeUnique
>;
const mockUserModelFindOne = UserModel.findOne as jest.MockedFunction<
  typeof UserModel.findOne
>;

// Global test constants shared across describe blocks
const mockAgentId = '507f1f77bcf86cd799439011';
const mockChannelId = '507f1f77bcf86cd799439012';
const mockDesignationId = '507f1f77bcf86cd799439013';
const mockProjectId = '507f1f77bcf86cd799439014';
const mockUserId = '507f1f77bcf86cd799439015';
const mockTeamLeadId = '507f1f77bcf86cd799439016';
const mockReportingManagerId = '507f1f77bcf86cd799439017';
const mockHierarchyId = '507f1f77bcf86cd799439018';
const mockAgentCode = 'AGT001';

describe('AgentService - All Methods Coverage', () => {
  let agentService: AgentService;

  const sampleAgent = {
    _id: new Types.ObjectId(mockAgentId),
    agentCode: mockAgentCode,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+1234567890',
    agentStatus: 'active',
    isDeleted: false,
    channelId: new Types.ObjectId(mockChannelId),
    designationId: new Types.ObjectId(mockDesignationId),
    userId: new Types.ObjectId(mockUserId),
    projectId: new Types.ObjectId(mockProjectId),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const baseCreateAgentData = {
    userId: mockUserId,
    channelId: mockChannelId,
    designationId: mockDesignationId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+1234567890',
    generateAgentCode: true,
  };

  const mockCreatedAgent = {
    _id: new Types.ObjectId(),
    agentCode: 'AGT001',
    ...baseCreateAgentData,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    agentService = new AgentService();

    // Reset mock implementations
    mockGenerateAgentCode.mockResolvedValue('AGT001');
    mockIsAgentCodeUnique.mockResolvedValue(true);
    mockCreate.mockResolvedValue(mockCreatedAgent);
    mockFindById.mockResolvedValue(sampleAgent);
    mockUserModelFindOne.mockResolvedValue(null);
  });

  // createAgent Tests
  it('should handle when projectId is provided in createAgent', async () => {
    const dataWithProjectId = {
      ...baseCreateAgentData,
      projectId: mockProjectId,
    };
    await agentService.createAgent(dataWithProjectId);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: new Types.ObjectId(mockProjectId),
      }),
    );
  });

  it('should handle when projectId is not provided in createAgent', async () => {
    const dataWithoutProjectId = {
      ...baseCreateAgentData,
      generateAgentCode: false,
      agentCode: 'NO_PROJECT001',
    };
    await agentService.createAgent(dataWithoutProjectId);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: undefined }),
    );
  });

  it('should use provided agentStatus when specified in createAgent', async () => {
    const dataWithStatus = {
      ...baseCreateAgentData,
      projectId: mockProjectId,
      agentStatus: 'inactive' as const,
    };
    await agentService.createAgent(dataWithStatus);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ agentStatus: 'inactive' }),
    );
  });

  it('should default to "active" when agentStatus is not provided in createAgent', async () => {
    const dataWithoutStatus = {
      ...baseCreateAgentData,
      projectId: mockProjectId,
    };
    await agentService.createAgent(dataWithoutStatus);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ agentStatus: 'active' }),
    );
  });

  it('should default to "active" when agentStatus is null in createAgent', async () => {
    const dataWithNullStatus = {
      ...baseCreateAgentData,
      projectId: mockProjectId,
      agentStatus: null as any,
    };
    await agentService.createAgent(dataWithNullStatus);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ agentStatus: 'active' }),
    );
  });

  it('should convert joiningDate to Date when provided in createAgent', async () => {
    const joiningDateString = '2024-01-15';
    const dataWithJoiningDate = {
      ...baseCreateAgentData,
      projectId: mockProjectId,
      joiningDate: joiningDateString,
    };
    await agentService.createAgent(dataWithJoiningDate);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ joiningDate: new Date(joiningDateString) }),
    );
  });

  it('should set joiningDate to undefined when not provided in createAgent', async () => {
    const dataWithoutJoiningDate = {
      ...baseCreateAgentData,
      projectId: mockProjectId,
    };
    await agentService.createAgent(dataWithoutJoiningDate);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ joiningDate: undefined }),
    );
  });

  it('should include targetAmount when provided in createAgent', async () => {
    const dataWithTargetAmount = {
      ...baseCreateAgentData,
      projectId: mockProjectId,
      targetAmount: 50000,
    };
    await agentService.createAgent(dataWithTargetAmount);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ targetAmount: 50000 }),
    );
  });

  it('should handle targetAmount when not provided in createAgent', async () => {
    const dataWithoutTargetAmount = {
      ...baseCreateAgentData,
      projectId: mockProjectId,
    };
    await agentService.createAgent(dataWithoutTargetAmount);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ targetAmount: undefined }),
    );
  });

  it('should use provided isTeamLead value when true in createAgent', async () => {
    const dataWithIsTeamLead = {
      ...baseCreateAgentData,
      projectId: mockProjectId,
      isTeamLead: true,
    };
    await agentService.createAgent(dataWithIsTeamLead);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ isTeamLead: true }),
    );
  });

  it('should default to false when isTeamLead is not provided in createAgent', async () => {
    const dataWithoutIsTeamLead = {
      ...baseCreateAgentData,
      projectId: mockProjectId,
    };
    await agentService.createAgent(dataWithoutIsTeamLead);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ isTeamLead: false }),
    );
  });

  it('should convert teamLeadId to ObjectId when provided in createAgent', async () => {
    const dataWithTeamLeadId = {
      ...baseCreateAgentData,
      projectId: mockProjectId,
      teamLeadId: mockTeamLeadId,
    };
    await agentService.createAgent(dataWithTeamLeadId);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        teamLeadId: new Types.ObjectId(mockTeamLeadId),
      }),
    );
  });

  it('should set teamLeadId to undefined when not provided in createAgent', async () => {
    const dataWithoutTeamLeadId = {
      ...baseCreateAgentData,
      projectId: mockProjectId,
    };
    await agentService.createAgent(dataWithoutTeamLeadId);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ teamLeadId: undefined }),
    );
  });

  it('should convert reportingManagerId to ObjectId when provided in createAgent', async () => {
    const dataWithReportingManagerId = {
      ...baseCreateAgentData,
      projectId: mockProjectId,
      reportingManagerId: mockReportingManagerId,
    };
    await agentService.createAgent(dataWithReportingManagerId);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        reportingManagerId: new Types.ObjectId(mockReportingManagerId),
      }),
    );
  });

  it('should throw error when neither agentCode nor generateAgentCode with projectId is provided in createAgent', async () => {
    const dataWithoutAgentCodeOrGeneration = {
      ...baseCreateAgentData,
      generateAgentCode: false,
    };
    await expect(
      agentService.createAgent(dataWithoutAgentCodeOrGeneration),
    ).rejects.toThrow(
      'Either agent code or generate agent code flag with project ID must be provided',
    );
  });

  it('should validate provided agentCode for uniqueness in createAgent', async () => {
    mockIsAgentCodeUnique.mockResolvedValue(true);
    const dataWithProvidedAgentCode = {
      ...baseCreateAgentData,
      generateAgentCode: false,
      agentCode: 'UNIQUE001',
    };
    await agentService.createAgent(dataWithProvidedAgentCode);
    expect(mockIsAgentCodeUnique).toHaveBeenCalledWith('UNIQUE001');
  });

  it('should throw error when provided agentCode is not unique in createAgent', async () => {
    mockIsAgentCodeUnique.mockResolvedValue(false);
    const dataWithDuplicateAgentCode = {
      ...baseCreateAgentData,
      generateAgentCode: false,
      agentCode: 'DUPLICATE001',
    };
    await expect(
      agentService.createAgent(dataWithDuplicateAgentCode),
    ).rejects.toThrow("Agent with code 'DUPLICATE001' already exists");
  });

  it('should handle repository creation errors gracefully in createAgent', async () => {
    const repositoryError = new Error('Database connection failed');
    mockCreate.mockRejectedValue(repositoryError);
    const dataWithError = { ...baseCreateAgentData, projectId: mockProjectId };
    await expect(agentService.createAgent(dataWithError)).rejects.toThrow(
      'Database connection failed',
    );
  });

  // getAgentById Tests
  it('should return agent when found and not deleted in getAgentById', async () => {
    mockFindById.mockResolvedValue(sampleAgent);
    const result = await agentService.getAgentById(mockAgentId);
    expect(result).toBeDefined();
    expect(result!._id).toEqual(sampleAgent._id);
    expect(result!.agentCode).toBe(sampleAgent.agentCode);
  });

  it('should return null when agent not found in getAgentById', async () => {
    mockFindById.mockResolvedValue(null);
    const result = await agentService.getAgentById(mockAgentId);
    expect(result).toBeNull();
  });

  it('should return null when agent is deleted in getAgentById', async () => {
    const deletedAgent = { ...sampleAgent, isDeleted: true };
    mockFindById.mockResolvedValue(deletedAgent);
    const result = await agentService.getAgentById(mockAgentId);
    expect(result).toBeNull();
  });

  it('should handle repository errors in getAgentById', async () => {
    const error = new Error('Database error');
    mockFindById.mockRejectedValue(error);
    await expect(agentService.getAgentById(mockAgentId)).rejects.toThrow(
      'Database error',
    );
  });

  // getAgentByCode Tests
  it('should return agent when found by code in getAgentByCode', async () => {
    mockFindByCode.mockResolvedValue(sampleAgent);
    const result = await agentService.getAgentByCode(mockAgentCode);
    expect(result).toBeDefined();
    expect(result!.agentCode).toBe(mockAgentCode);
  });

  it('should return null when agent not found by code in getAgentByCode', async () => {
    mockFindByCode.mockResolvedValue(null);
    const result = await agentService.getAgentByCode(mockAgentCode);
    expect(result).toBeNull();
  });

  it('should handle repository errors in getAgentByCode', async () => {
    const error = new Error('Database error');
    mockFindByCode.mockRejectedValue(error);
    await expect(agentService.getAgentByCode(mockAgentCode)).rejects.toThrow(
      'Database error',
    );
  });

  // getAllAgents Tests
  it('should return paginated agents with default parameters in getAllAgents', async () => {
    const mockPaginationResult = {
      agents: [sampleAgent],
      total: 1,
      totalPages: 1,
    };
    mockFindWithPagination.mockResolvedValue(mockPaginationResult);
    const result = await agentService.getAllAgents();
    expect(result).toBeDefined();
    expect(result.agents).toHaveLength(1);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(10);
  });

  it('should return paginated agents with custom parameters in getAllAgents', async () => {
    const mockPaginationResult = {
      agents: [sampleAgent],
      total: 1,
      totalPages: 1,
    };
    mockFindWithPagination.mockResolvedValue(mockPaginationResult);
    const result = await agentService.getAllAgents(
      2,
      20,
      'active',
      mockChannelId,
      mockUserId,
      mockProjectId,
    );
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.limit).toBe(20);
    expect(mockFindWithPagination).toHaveBeenCalledWith(
      {
        agentStatus: 'active',
        channelId: new Types.ObjectId(mockChannelId),
        userId: new Types.ObjectId(mockUserId),
        projectId: new Types.ObjectId(mockProjectId),
      },
      2,
      20,
    );
  });

  it('should handle repository errors in getAllAgents', async () => {
    const error = new Error('Database error');
    mockFindWithPagination.mockRejectedValue(error);
    await expect(agentService.getAllAgents()).rejects.toThrow('Database error');
  });

  // Other Service Method Tests
  it('should return all active agents in getActiveAgents', async () => {
    const activeAgents = [
      sampleAgent,
      { ...sampleAgent, _id: new Types.ObjectId() },
    ];
    mockFindActiveAgents.mockResolvedValue(activeAgents);
    const result = await agentService.getActiveAgents();
    expect(result).toHaveLength(2);
  });

  it('should handle repository errors in getActiveAgents', async () => {
    const error = new Error('Database error');
    mockFindActiveAgents.mockRejectedValue(error);
    await expect(agentService.getActiveAgents()).rejects.toThrow(
      'Database error',
    );
  });

  it('should return agents for given channel ID in getAgentsByChannelId', async () => {
    const channelAgents = [sampleAgent];
    mockFindAgentsByChannelId.mockResolvedValue(channelAgents);
    const result = await agentService.getAgentsByChannelId(mockChannelId);
    expect(result).toHaveLength(1);
    expect(mockFindAgentsByChannelId).toHaveBeenCalledWith(mockChannelId);
  });

  it('should handle repository errors in getAgentsByChannelId', async () => {
    const error = new Error('Database error');
    mockFindAgentsByChannelId.mockRejectedValue(error);
    await expect(
      agentService.getAgentsByChannelId(mockChannelId),
    ).rejects.toThrow('Database error');
  });

  it('should return agents for given project ID in getAgentsByProjectId', async () => {
    const projectAgents = [sampleAgent];
    mockFindAgentsByProjectId.mockResolvedValue(projectAgents);
    const result = await agentService.getAgentsByProjectId(mockProjectId);
    expect(result).toHaveLength(1);
  });

  it('should handle repository errors in getAgentsByProjectId', async () => {
    const error = new Error('Database error');
    mockFindAgentsByProjectId.mockRejectedValue(error);
    await expect(
      agentService.getAgentsByProjectId(mockProjectId),
    ).rejects.toThrow('Database error');
  });

  it('should return agents for given user ID in getAgentsByUserId', async () => {
    const userAgents = [sampleAgent];
    mockFindAgentsByUserId.mockResolvedValue(userAgents);
    const result = await agentService.getAgentsByUserId(mockUserId);
    expect(result).toHaveLength(1);
  });

  it('should handle repository errors in getAgentsByUserId', async () => {
    const error = new Error('Database error');
    mockFindAgentsByUserId.mockRejectedValue(error);
    await expect(agentService.getAgentsByUserId(mockUserId)).rejects.toThrow(
      'Database error',
    );
  });

  // getAgentHierarchyInfo Tests
  it('should return hierarchies when only agentId is provided in getAgentHierarchyInfo', async () => {
    const agentWithDesignation = {
      ...sampleAgent,
      designationId: mockDesignationId,
      channelId: mockChannelId,
    };
    mockFindById.mockResolvedValue(agentWithDesignation);

    const mockDesignation = {
      _id: mockDesignationId,
      designationName: 'Sales Executive',
      hierarchy: { _id: mockHierarchyId, hierarchyLevelCode: '3' },
    };
    const mockHierarchies = [
      {
        _id: '507f1f77bcf86cd799439017',
        hierarchyName: 'Manager',
        hierarchyLevelCode: '1',
      },
      {
        _id: '507f1f77bcf86cd799439018',
        hierarchyName: 'Team Lead',
        hierarchyLevelCode: '2',
      },
      {
        _id: mockHierarchyId,
        hierarchyName: 'Sales Executive',
        hierarchyLevelCode: '3',
      },
    ];
    const mockHierarchyDetails = {
      _id: mockHierarchyId,
      hierarchyName: 'Sales Executive',
      hierarchyLevelCode: '3',
    };

    mockGetDesignationById.mockResolvedValue(mockDesignation);
    mockGetHierarchiesByChannel.mockResolvedValue(mockHierarchies);
    mockGetHierarchyById.mockResolvedValue(mockHierarchyDetails);

    const result = await agentService.getAgentHierarchyInfo(mockAgentId);
    expect(result.hierarchies).toBeDefined();
    expect(result.hierarchies).toHaveLength(2);
    expect(result.agents).toBeUndefined();
  });

  it('should return agents when hierarchyId and channelId are provided in getAgentHierarchyInfo', async () => {
    const agentWithDesignation = {
      ...sampleAgent,
      designationId: mockDesignationId,
      channelId: mockChannelId,
    };
    mockFindById.mockResolvedValue(agentWithDesignation);

    const mockDesignation = {
      _id: mockDesignationId,
      designationName: 'Sales Executive',
      hierarchy: { _id: mockHierarchyId, hierarchyLevelCode: '3' },
    };
    const mockTargetDesignations = [
      { _id: '507f1f77bcf86cd799439019', designationName: 'Manager' },
    ];
    const mockAgentsInHierarchy = [
      { _id: new Types.ObjectId(), firstName: 'Jane', lastName: 'Manager' },
    ];
    const mockHierarchyDetails = {
      _id: mockHierarchyId,
      hierarchyName: 'Sales Executive',
      hierarchyLevelCode: '3',
    };

    mockGetDesignationById.mockResolvedValue(mockDesignation);
    mockGetDesignationsByHierarchyId.mockResolvedValue(mockTargetDesignations);
    mockFindAgentsByDesignationAndChannel.mockResolvedValue(
      mockAgentsInHierarchy,
    );
    mockGetHierarchyById.mockResolvedValue(mockHierarchyDetails);

    const result = await agentService.getAgentHierarchyInfo(
      mockAgentId,
      mockHierarchyId,
      mockChannelId,
    );
    expect(result.agents).toBeDefined();
    expect(result.agents).toHaveLength(1);
    expect(result.hierarchies).toBeUndefined();
  });

  it('should handle agent not found in getAgentHierarchyInfo', async () => {
    mockFindById.mockResolvedValue(null);
    await expect(
      agentService.getAgentHierarchyInfo(mockAgentId),
    ).rejects.toThrow('Agent not found');
  });

  it('should handle invalid designation ID format in getAgentHierarchyInfo', async () => {
    const agentWithInvalidDesignation = {
      ...sampleAgent,
      designationId: 'invalid-format',
    };
    mockFindById.mockResolvedValue(agentWithInvalidDesignation);
    await expect(
      agentService.getAgentHierarchyInfo(mockAgentId),
    ).rejects.toThrow(
      'Invalid designation ID format - must be a valid MongoDB ObjectId',
    );
  });

  // getAgentHierarchyWithAgents Tests
  it('should return hierarchies with agents successfully in getAgentHierarchyWithAgents', async () => {
    const mockAgent = {
      _id: new Types.ObjectId(mockAgentId),
      designationId: {
        _id: mockDesignationId,
        hierarchy: { hierarchyLevelCode: '3' },
      },
      agentStatus: 'active',
      isDeleted: false,
    };
    const mockDesignation = {
      _id: mockDesignationId,
      designationName: 'Sales Executive',
      hierarchy: { hierarchyLevelCode: '3' },
    };
    const mockHierarchies = [
      {
        _id: '507f1f77bcf86cd799439015',
        hierarchyName: 'Country Head',
        hierarchyLevelCode: '1',
      },
      {
        _id: '507f1f77bcf86cd799439016',
        hierarchyName: 'Regional Manager',
        hierarchyLevelCode: '2',
      },
    ];

    mockFindById.mockResolvedValue(mockAgent);
    mockGetDesignationById.mockResolvedValue(mockDesignation);
    mockGetHierarchiesByChannel.mockResolvedValue(mockHierarchies);
    mockGetDesignationsByHierarchyId.mockResolvedValue([]);
    mockFindAgentsByDesignationAndChannel.mockResolvedValue([]);

    const result = await agentService.getAgentHierarchyWithAgents(
      mockAgentId,
      mockChannelId,
    );
    expect(result).toBeDefined();
    expect(result.hierarchies).toBeDefined();
    expect(Array.isArray(result.hierarchies)).toBe(true);
  });

  it('should throw error for invalid agent ID in getAgentHierarchyWithAgents', async () => {
    const invalidAgentId = 'invalid-id';
    await expect(
      agentService.getAgentHierarchyWithAgents(invalidAgentId, mockChannelId),
    ).rejects.toThrow(DatabaseException);
  });

  it('should throw error for invalid channel ID in getAgentHierarchyWithAgents', async () => {
    const invalidChannelId = 'invalid-id';
    await expect(
      agentService.getAgentHierarchyWithAgents(mockAgentId, invalidChannelId),
    ).rejects.toThrow(DatabaseException);
  });

  it('should throw error when agent is not found in getAgentHierarchyWithAgents', async () => {
    mockFindById.mockResolvedValue(null);
    await expect(
      agentService.getAgentHierarchyWithAgents(mockAgentId, mockChannelId),
    ).rejects.toThrow('Agent not found');
  });
});

describe('AgentService - Additional Edge Cases', () => {
  let agentService: AgentService;

  beforeEach(() => {
    jest.clearAllMocks();
    agentService = new AgentService();
    mockUserModelFindOne.mockResolvedValue(null);
  });

  it('should handle data extraction utility methods', async () => {
    const mockAgent = {
      _id: new Types.ObjectId(mockAgentId),
      channelId: {
        _id: '507f1f77bcf86cd799439040',
        channelName: 'Direct Sales',
        channelCode: 'DS001',
      },
      designationId: {
        _id: '507f1f77bcf86cd799439041',
        designationName: 'Senior Sales Executive',
        designationCode: 'SSE001',
      },
      projectId: {
        _id: '507f1f77bcf86cd799439042',
        projectName: 'Premium Sales Project',
        projectCode: 'PSP001',
      },
      teamLeadId: {
        _id: '507f1f77bcf86cd799439043',
        firstName: 'John',
        middleName: 'Michael',
        lastName: 'Smith',
        agentCode: 'TL001',
      },
      firstName: 'Test',
      lastName: 'Agent',
      agentCode: 'TST001',
      agentStatus: 'active',
      isDeleted: false,
    };

    mockFindById.mockResolvedValue(mockAgent);
    const result = await agentService.getAgentById(mockAgentId);

    expect(result).toBeDefined();
    expect(result!.channelId).toBe('507f1f77bcf86cd799439040');
    expect(result!.channelName).toBe('Direct Sales');
    expect(result!.channelCode).toBe('DS001');
    expect(result!.designationName).toBe('Senior Sales Executive');
    expect(result!.projectName).toBe('Premium Sales Project');
    expect(result!.teamLeadName).toBe('John Michael Smith');
  });

  it('should handle full name generation', async () => {
    const mockAgent = {
      _id: new Types.ObjectId(mockAgentId),
      firstName: 'John',
      middleName: 'Michael',
      lastName: 'Smith',
      agentCode: 'TST001',
      agentStatus: 'active',
      isDeleted: false,
    };

    mockFindById.mockResolvedValue(mockAgent);
    const result = await agentService.getAgentById(mockAgentId);
    expect(result!.fullName).toBe('John Michael Smith');
  });

  it('should handle null values in data extraction', async () => {
    const mockAgent = {
      _id: new Types.ObjectId(mockAgentId),
      channelId: null,
      designationId: null,
      projectId: null,
      teamLeadId: null,
      firstName: 'Test',
      lastName: 'Agent',
      agentCode: 'TST001',
      agentStatus: 'active',
      isDeleted: false,
    };

    mockFindById.mockResolvedValue(mockAgent);
    const result = await agentService.getAgentById(mockAgentId);

    expect(result!.channelId).toBe('');
    expect(result!.designationId).toBe('');
    expect(result!.projectId).toBeUndefined();
    expect(result!.teamLeadId).toBeUndefined();
  });

  // bulkCreateAgents Tests
  it('should successfully create multiple agents in bulkCreateAgents', async () => {
    const mockUser = {
      _id: new Types.ObjectId(mockUserId),
      projectId: new Types.ObjectId(mockProjectId),
      role: 'user',
    };

    const bulkData = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
        channelId: mockChannelId,
        designationId: mockDesignationId,
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phoneNumber: '+1234567891',
        channelId: mockChannelId,
        designationId: mockDesignationId,
      },
    ];

    const mockCreatedAgent1 = {
      _id: new Types.ObjectId(),
      agentCode: 'AGT001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      channelId: '',
      designationId: '',
      agentStatus: 'active' as const,
      fullName: 'John Doe',
      isDeleted: false,
      isTeamLead: false,
      phoneNumber: '+1234567890',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockCreatedAgent2 = {
      _id: new Types.ObjectId(),
      agentCode: 'AGT002',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      channelId: '',
      designationId: '',
      agentStatus: 'active' as const,
      fullName: 'Jane Smith',
      isDeleted: false,
      isTeamLead: false,
      phoneNumber: '+1234567891',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUserModelFindOne.mockResolvedValue(mockUser);
    mockGenerateAgentCode
      .mockResolvedValueOnce('AGT001')
      .mockResolvedValueOnce('AGT002');

    // Mock createAgent to return different agents for each call
    jest
      .spyOn(agentService, 'createAgent')
      .mockResolvedValueOnce(mockCreatedAgent1)
      .mockResolvedValueOnce(mockCreatedAgent2);

    const result = await agentService.bulkCreateAgents(bulkData, mockProjectId);

    expect(result.success).toBe(true);
    expect(result.totalProcessed).toBe(2);
    expect(result.successCount).toBe(2);
    expect(result.failureCount).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(result.createdAgents).toHaveLength(2);
    expect(result.createdAgents[0]).toEqual({
      agentCode: 'AGT001',
      email: 'john.doe@example.com',
      name: 'John Doe',
    });
    expect(result.createdAgents[1]).toEqual({
      agentCode: 'AGT002',
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
    });
  });

  it('should handle missing required fields in bulkCreateAgents', async () => {
    const mockUser = {
      _id: new Types.ObjectId(mockUserId),
      projectId: new Types.ObjectId(mockProjectId),
      role: 'user',
    };

    const bulkDataWithMissingFields = [
      {
        firstName: 'John',
        // lastName missing
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
        channelId: mockChannelId,
        designationId: mockDesignationId,
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        // email missing
        phoneNumber: '+1234567891',
        channelId: mockChannelId,
        designationId: mockDesignationId,
      },
    ];

    mockUserModelFindOne.mockResolvedValue(mockUser);

    const result = await agentService.bulkCreateAgents(
      bulkDataWithMissingFields,
      mockProjectId,
    );

    expect(result.success).toBe(false);
    expect(result.totalProcessed).toBe(2);
    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(2);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].row).toBe(1);
    expect(result.errors[0].error).toContain('Missing required fields');
    expect(result.errors[1].row).toBe(2);
    expect(result.errors[1].error).toContain('Missing required fields');
  });

  it('should handle invalid ObjectId formats in bulkCreateAgents', async () => {
    const mockUser = {
      _id: new Types.ObjectId(mockUserId),
      projectId: new Types.ObjectId(mockProjectId),
      role: 'user',
    };

    const bulkDataWithInvalidIds = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
        channelId: 'invalid-channel-id',
        designationId: mockDesignationId,
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phoneNumber: '+1234567891',
        channelId: mockChannelId,
        designationId: 'invalid-designation-id',
      },
    ];

    mockUserModelFindOne.mockResolvedValue(mockUser);

    const result = await agentService.bulkCreateAgents(
      bulkDataWithInvalidIds,
      mockProjectId,
    );

    expect(result.success).toBe(false);
    expect(result.totalProcessed).toBe(2);
    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(2);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].error).toContain(
      'Invalid channelId or designationId format',
    );
    expect(result.errors[1].error).toContain(
      'Invalid channelId or designationId format',
    );
  });

  it('should handle user not found for project in bulkCreateAgents', async () => {
    const bulkData = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
        channelId: mockChannelId,
        designationId: mockDesignationId,
      },
    ];

    mockUserModelFindOne.mockResolvedValue(null);

    await expect(
      agentService.bulkCreateAgents(bulkData, mockProjectId),
    ).rejects.toThrow('No user found associated with the project');
  });

  it('should handle createAgent errors in bulkCreateAgents', async () => {
    const mockUser = {
      _id: new Types.ObjectId(mockUserId),
      projectId: new Types.ObjectId(mockProjectId),
      role: 'user',
    };

    const bulkData = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
        channelId: mockChannelId,
        designationId: mockDesignationId,
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phoneNumber: '+1234567891',
        channelId: mockChannelId,
        designationId: mockDesignationId,
      },
    ];

    mockUserModelFindOne.mockResolvedValue(mockUser);
    mockGenerateAgentCode
      .mockResolvedValueOnce('AGT001')
      .mockResolvedValueOnce('AGT002');

    // Mock createAgent to succeed for first agent, fail for second
    const mockSuccessAgent = {
      _id: new Types.ObjectId(),
      agentCode: 'AGT001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      channelId: '',
      designationId: '',
      agentStatus: 'active' as const,
      fullName: 'John Doe',
      isDeleted: false,
      isTeamLead: false,
      phoneNumber: '+1234567890',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest
      .spyOn(agentService, 'createAgent')
      .mockResolvedValueOnce(mockSuccessAgent)
      .mockRejectedValueOnce(new Error('Agent creation failed'));

    const result = await agentService.bulkCreateAgents(bulkData, mockProjectId);

    expect(result.success).toBe(false);
    expect(result.totalProcessed).toBe(2);
    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(2);
    expect(result.errors[0].error).toBe('Agent creation failed');
    expect(result.createdAgents).toHaveLength(1);
  });

  it('should handle mixed success and failure scenarios in bulkCreateAgents', async () => {
    const mockUser = {
      _id: new Types.ObjectId(mockUserId),
      projectId: new Types.ObjectId(mockProjectId),
      role: 'user',
    };

    const bulkData = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
        channelId: mockChannelId,
        designationId: mockDesignationId,
      },
      {
        // Missing lastName
        firstName: 'Jane',
        email: 'jane.smith@example.com',
        phoneNumber: '+1234567891',
        channelId: mockChannelId,
        designationId: mockDesignationId,
      },
      {
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@example.com',
        phoneNumber: '+1234567892',
        channelId: mockChannelId,
        designationId: mockDesignationId,
      },
    ];

    mockUserModelFindOne.mockResolvedValue(mockUser);
    mockGenerateAgentCode
      .mockResolvedValueOnce('AGT001')
      .mockResolvedValueOnce('AGT003'); // Skip AGT002 due to validation failure

    const mockAgent1 = {
      _id: new Types.ObjectId(),
      agentCode: 'AGT001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      channelId: '',
      designationId: '',
      agentStatus: 'active' as const,
      fullName: 'John Doe',
      isDeleted: false,
      isTeamLead: false,
      phoneNumber: '+1234567890',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockAgent3 = {
      _id: new Types.ObjectId(),
      agentCode: 'AGT003',
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob.johnson@example.com',
      channelId: '',
      designationId: '',
      agentStatus: 'active' as const,
      fullName: 'Bob Johnson',
      isDeleted: false,
      isTeamLead: false,
      phoneNumber: '+1234567892',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest
      .spyOn(agentService, 'createAgent')
      .mockResolvedValueOnce(mockAgent1)
      .mockResolvedValueOnce(mockAgent3);

    const result = await agentService.bulkCreateAgents(bulkData, mockProjectId);

    expect(result.success).toBe(false);
    expect(result.totalProcessed).toBe(3);
    expect(result.successCount).toBe(2);
    expect(result.failureCount).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(2);
    expect(result.createdAgents).toHaveLength(2);
    expect(result.createdAgents[0].name).toBe('John Doe');
    expect(result.createdAgents[1].name).toBe('Bob Johnson');
  });

  it('should handle database connection errors in bulkCreateAgents', async () => {
    const bulkData = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
        channelId: mockChannelId,
        designationId: mockDesignationId,
      },
    ];

    mockUserModelFindOne.mockRejectedValue(
      new Error('Database connection failed'),
    );

    await expect(
      agentService.bulkCreateAgents(bulkData, mockProjectId),
    ).rejects.toThrow('Database connection failed');
  });

  it('should handle empty data array in bulkCreateAgents', async () => {
    const mockUser = {
      _id: new Types.ObjectId(mockUserId),
      projectId: new Types.ObjectId(mockProjectId),
      role: 'user',
    };

    mockUserModelFindOne.mockResolvedValue(mockUser);

    const result = await agentService.bulkCreateAgents([], mockProjectId);

    expect(result.success).toBe(true);
    expect(result.totalProcessed).toBe(0);
    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(result.createdAgents).toHaveLength(0);
  });

  it('should handle generateAgentCode failure in bulkCreateAgents', async () => {
    const mockUser = {
      _id: new Types.ObjectId(mockUserId),
      projectId: new Types.ObjectId(mockProjectId),
      role: 'user',
    };

    const bulkData = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
        channelId: mockChannelId,
        designationId: mockDesignationId,
      },
    ];

    mockUserModelFindOne.mockResolvedValue(mockUser);
    mockGenerateAgentCode.mockRejectedValue(
      new Error('Agent code generation failed'),
    );

    const result = await agentService.bulkCreateAgents(bulkData, mockProjectId);

    expect(result.success).toBe(false);
    expect(result.totalProcessed).toBe(1);
    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toBe('Agent code generation failed');
  });

  // Test private method coverage through public methods
  it('should handle primitive types in extractChannelData via getAgentById', async () => {
    const mockAgent = {
      _id: new Types.ObjectId(mockAgentId),
      channelId: 'string-channel-id', // primitive string
      firstName: 'Test',
      lastName: 'Agent',
      agentCode: 'TST001',
      agentStatus: 'active',
      isDeleted: false,
    };

    mockFindById.mockResolvedValue(mockAgent);
    const result = await agentService.getAgentById(mockAgentId);
    expect(result!.channelId).toBe('string-channel-id');
  });

  it('should handle number type in extractChannelData via getAgentById', async () => {
    const mockAgent = {
      _id: new Types.ObjectId(mockAgentId),
      channelId: 123, // primitive number
      firstName: 'Test',
      lastName: 'Agent',
      agentCode: 'TST001',
      agentStatus: 'active',
      isDeleted: false,
    };

    mockFindById.mockResolvedValue(mockAgent);
    const result = await agentService.getAgentById(mockAgentId);
    expect(result!.channelId).toBe('123');
  });

  it('should handle boolean type in extractChannelData via getAgentById', async () => {
    const mockAgent = {
      _id: new Types.ObjectId(mockAgentId),
      channelId: true, // primitive boolean
      firstName: 'Test',
      lastName: 'Agent',
      agentCode: 'TST001',
      agentStatus: 'active',
      isDeleted: false,
    };

    mockFindById.mockResolvedValue(mockAgent);
    const result = await agentService.getAgentById(mockAgentId);
    expect(result!.channelId).toBe('true');
  });

  it('should handle primitive types in extractDesignationData via getAgentById', async () => {
    const mockAgent = {
      _id: new Types.ObjectId(mockAgentId),
      designationId: 'string-designation-id', // primitive string
      firstName: 'Test',
      lastName: 'Agent',
      agentCode: 'TST001',
      agentStatus: 'active',
      isDeleted: false,
    };

    mockFindById.mockResolvedValue(mockAgent);
    const result = await agentService.getAgentById(mockAgentId);
    expect(result!.designationId).toBe('string-designation-id');
  });

  it('should handle number type in extractDesignationData via getAgentById', async () => {
    const mockAgent = {
      _id: new Types.ObjectId(mockAgentId),
      designationId: 456, // primitive number
      firstName: 'Test',
      lastName: 'Agent',
      agentCode: 'TST001',
      agentStatus: 'active',
      isDeleted: false,
    };

    mockFindById.mockResolvedValue(mockAgent);
    const result = await agentService.getAgentById(mockAgentId);
    expect(result!.designationId).toBe('456');
  });

  it('should handle boolean type in extractDesignationData via getAgentById', async () => {
    const mockAgent = {
      _id: new Types.ObjectId(mockAgentId),
      designationId: false, // primitive boolean
      firstName: 'Test',
      lastName: 'Agent',
      agentCode: 'TST001',
      agentStatus: 'active',
      isDeleted: false,
    };

    mockFindById.mockResolvedValue(mockAgent);
    const result = await agentService.getAgentById(mockAgentId);
    expect(result!.designationId).not.toBe('false');
  });

  it('should handle primitive types in extractProjectData via getAgentById', async () => {
    const mockAgent = {
      _id: new Types.ObjectId(mockAgentId),
      projectId: 'string-project-id', // primitive string
      firstName: 'Test',
      lastName: 'Agent',
      agentCode: 'TST001',
      agentStatus: 'active',
      isDeleted: false,
    };

    mockFindById.mockResolvedValue(mockAgent);
    const result = await agentService.getAgentById(mockAgentId);
    expect(result!.projectId).toBe('string-project-id');
  });

  it('should handle number type in extractProjectData via getAgentById', async () => {
    const mockAgent = {
      _id: new Types.ObjectId(mockAgentId),
      projectId: 789, // primitive number
      firstName: 'Test',
      lastName: 'Agent',
      agentCode: 'TST001',
      agentStatus: 'active',
      isDeleted: false,
    };

    mockFindById.mockResolvedValue(mockAgent);
    const result = await agentService.getAgentById(mockAgentId);
    expect(result!.projectId).toBe('789');
  });

  it('should handle boolean type in extractProjectData via getAgentById', async () => {
    const mockAgent = {
      _id: new Types.ObjectId(mockAgentId),
      projectId: true, // primitive boolean
      firstName: 'Test',
      lastName: 'Agent',
      agentCode: 'TST001',
      agentStatus: 'active',
      isDeleted: false,
    };

    mockFindById.mockResolvedValue(mockAgent);
    const result = await agentService.getAgentById(mockAgentId);
    expect(result!.projectId).toBe('true');
  });

  it('should handle fallback for other types in extractDesignationData via getAgentById', async () => {
    const mockAgent = {
      _id: new Types.ObjectId(mockAgentId),
      designationId: { nonStandardObject: 'without _id' }, // object without _id
      firstName: 'Test',
      lastName: 'Agent',
      agentCode: 'TST001',
      agentStatus: 'active',
      isDeleted: false,
    };

    mockFindById.mockResolvedValue(mockAgent);
    const result = await agentService.getAgentById(mockAgentId);
    expect(result!.designationId).toBe('');
  });

  // Test coverage for getAgentsForFilteredHierarchies method via getAgentHierarchyWithAgents
  it('should filter and map agents correctly in getAgentHierarchyWithAgents', async () => {
    const mockAgent = {
      _id: new Types.ObjectId(mockAgentId),
      designationId: {
        _id: mockDesignationId,
        hierarchy: { hierarchyLevelCode: '3' },
      },
      agentStatus: 'active',
      isDeleted: false,
    };

    const mockDesignation = {
      _id: mockDesignationId,
      designationName: 'Sales Executive',
      hierarchy: { hierarchyLevelCode: '3' },
    };

    const mockHierarchies = [
      {
        _id: '507f1f77bcf86cd799439015',
        hierarchyName: 'Manager',
        hierarchyLevelCode: '1',
      },
      {
        _id: '507f1f77bcf86cd799439016',
        hierarchyName: 'Team Lead',
        hierarchyLevelCode: '2',
      },
    ];

    const mockTargetDesignations = [
      { _id: '507f1f77bcf86cd799439020', designationName: 'Manager' },
    ];

    // Mock agents with various conditions to test filtering
    const mockFoundAgents = [
      {
        _id: new Types.ObjectId(),
        firstName: 'John',
        lastName: 'Doe',
        agentCode: 'AGT001',
        agentStatus: 'active',
        isDeleted: false,
      },
      {
        _id: new Types.ObjectId(),
        firstName: null, // Should be filtered out
        lastName: 'Smith',
        agentCode: 'AGT002',
        agentStatus: 'active',
        isDeleted: false,
      },
      {
        _id: new Types.ObjectId(),
        firstName: 'Jane',
        lastName: null, // Should be filtered out
        agentCode: 'AGT003',
        agentStatus: 'active',
        isDeleted: false,
      },
      {
        _id: new Types.ObjectId(),
        firstName: 'Bob',
        lastName: 'Johnson',
        agentCode: 'AGT004',
        agentStatus: 'inactive', // Should be filtered out
        isDeleted: false,
      },
      {
        _id: new Types.ObjectId(),
        firstName: 'Alice',
        lastName: 'Wilson',
        agentCode: 'AGT005',
        agentStatus: 'active',
        isDeleted: true, // Should be filtered out
      },
      {
        _id: new Types.ObjectId(),
        firstName: 'Mike',
        lastName: 'Brown',
        agentCode: 'AGT006',
        agentStatus: 'active',
        isDeleted: false,
      },
    ];

    mockFindById.mockResolvedValue(mockAgent);
    mockGetDesignationById.mockResolvedValue(mockDesignation);
    mockGetHierarchiesByChannel.mockResolvedValue(mockHierarchies);
    mockGetDesignationsByHierarchyId.mockResolvedValue(mockTargetDesignations);
    mockFindAgentsByDesignationAndChannel.mockResolvedValue(mockFoundAgents);

    const result = await agentService.getAgentHierarchyWithAgents(
      mockAgentId,
      mockChannelId,
    );

    expect(result).toBeDefined();
    expect(result.hierarchies).toBeDefined();
    expect(Array.isArray(result.hierarchies)).toBe(true);

    // Should have agents that passed the filter (John Doe and Mike Brown)
    const hierarchyWithAgents = result.hierarchies.find(
      h => h.agents.length > 0,
    );
    if (hierarchyWithAgents) {
      expect(hierarchyWithAgents.agents).toHaveLength(2);
      expect(hierarchyWithAgents.agents[0].firstName).toBe('John');
      expect(hierarchyWithAgents.agents[0].lastName).toBe('Doe');
      expect(hierarchyWithAgents.agents[0].designationName).toBe('Manager');
      expect(hierarchyWithAgents.agents[1].firstName).toBe('Mike');
      expect(hierarchyWithAgents.agents[1].lastName).toBe('Brown');
    }
  });

  it('should handle hierarchy with no valid agents in getAgentHierarchyWithAgents', async () => {
    const mockAgent = {
      _id: new Types.ObjectId(mockAgentId),
      designationId: {
        _id: mockDesignationId,
        hierarchy: { hierarchyLevelCode: '3' },
      },
      agentStatus: 'active',
      isDeleted: false,
    };

    const mockDesignation = {
      _id: mockDesignationId,
      designationName: 'Sales Executive',
      hierarchy: { hierarchyLevelCode: '3' },
    };

    const mockHierarchies = [
      {
        _id: '507f1f77bcf86cd799439015',
        hierarchyName: 'Manager',
        hierarchyLevelCode: '1',
      },
    ];

    const mockTargetDesignations = [
      { _id: '507f1f77bcf86cd799439020', designationName: 'Manager' },
    ];

    // Mock agents that will all be filtered out
    const mockFoundAgents = [
      {
        _id: new Types.ObjectId(),
        firstName: null, // Will be filtered out
        lastName: 'Smith',
        agentCode: 'AGT002',
        agentStatus: 'active',
        isDeleted: false,
      },
      {
        _id: new Types.ObjectId(),
        firstName: 'Jane',
        lastName: 'Doe',
        agentCode: 'AGT003',
        agentStatus: 'inactive', // Will be filtered out
        isDeleted: false,
      },
    ];

    mockFindById.mockResolvedValue(mockAgent);
    mockGetDesignationById.mockResolvedValue(mockDesignation);
    mockGetHierarchiesByChannel.mockResolvedValue(mockHierarchies);
    mockGetDesignationsByHierarchyId.mockResolvedValue(mockTargetDesignations);
    mockFindAgentsByDesignationAndChannel.mockResolvedValue(mockFoundAgents);

    const result = await agentService.getAgentHierarchyWithAgents(
      mockAgentId,
      mockChannelId,
    );

    expect(result).toBeDefined();
    expect(result.hierarchies).toBeDefined();
    // Should not include hierarchies with no valid agents
    expect(
      result.hierarchies.every(
        h => h.agents.length === 0 || h.agents.length > 0,
      ),
    ).toBe(true);
  });
});
