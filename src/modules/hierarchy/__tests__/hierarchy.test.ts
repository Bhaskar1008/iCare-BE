import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AgentModel } from '@/models/agent.model';
import { DesignationModel } from '@/models/designation.model';
import { HierarchyModel } from '@/models/hierarchy.model';
import { HierarchyService } from '../hierarchy.service';

describe('HierarchyService', () => {
  let mongoServer: MongoMemoryServer;
  let hierarchyService: HierarchyService;
  let channelId: mongoose.Types.ObjectId;
  let hierarchyIds: mongoose.Types.ObjectId[];
  let designationIds: mongoose.Types.ObjectId[];
  let agentIds: mongoose.Types.ObjectId[];

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    hierarchyService = new HierarchyService();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    await Promise.all([
      AgentModel.deleteMany({}),
      DesignationModel.deleteMany({}),
      HierarchyModel.deleteMany({}),
    ]);

    // Setup test data
    channelId = new mongoose.Types.ObjectId();

    // Create hierarchies
    const hierarchies = await HierarchyModel.create([
      {
        channelId,
        hierarchyName: 'Level 1',
        hierarchyLevelCode: '1',
        hierarchyLevel: 1,
        hierarchyStatus: 'active',
        hierarchyOrder: 1,
      },
      {
        channelId,
        hierarchyName: 'Level 3',
        hierarchyLevelCode: '3',
        hierarchyLevel: 3,
        hierarchyStatus: 'active',
        hierarchyOrder: 3,
      },
      {
        channelId,
        hierarchyName: 'Level 5',
        hierarchyLevelCode: '5',
        hierarchyLevel: 5,
        hierarchyStatus: 'active',
        hierarchyOrder: 5,
      },
    ]);

    hierarchyIds = hierarchies.map(h => new mongoose.Types.ObjectId(h._id));

    // Create designations
    const designations = await DesignationModel.create([
      {
        channelId,
        hierarchyId: hierarchyIds[0],
        designationName: 'Manager L1',
        designationCode: 'MGR_L1',
        roleId: new mongoose.Types.ObjectId(),
        designationStatus: 'active',
        designationOrder: 1,
      },
      {
        channelId,
        hierarchyId: hierarchyIds[1],
        designationName: 'Manager L3',
        designationCode: 'MGR_L3',
        roleId: new mongoose.Types.ObjectId(),
        designationStatus: 'active',
        designationOrder: 3,
      },
      {
        channelId,
        hierarchyId: hierarchyIds[2],
        designationName: 'Manager L5',
        designationCode: 'MGR_L5',
        roleId: new mongoose.Types.ObjectId(),
        designationStatus: 'active',
        designationOrder: 5,
      },
    ]);

    designationIds = designations.map(d => new mongoose.Types.ObjectId(d._id));

    // Create agents
    const agents = await AgentModel.create([
      {
        userId: new mongoose.Types.ObjectId(),
        channelId,
        designationId: designationIds[0],
        agentCode: 'AGT001',
        firstName: 'John',
        lastName: 'Doe',
        agentStatus: 'active',
        email: 'john.doe@example.com',
        phoneNumber: '91234567001',
      },
      {
        userId: new mongoose.Types.ObjectId(),
        channelId,
        designationId: designationIds[1],
        agentCode: 'AGT002',
        firstName: 'Jane',
        lastName: 'Smith',
        agentStatus: 'active',
        email: 'jane.smith@example.com',
        phoneNumber: '91234567002',
      },
      {
        userId: new mongoose.Types.ObjectId(),
        channelId,
        designationId: designationIds[2],
        agentCode: 'AGT003',
        firstName: 'Bob',
        lastName: 'Johnson',
        agentStatus: 'active',
        email: 'bob.johnson@example.com',
        phoneNumber: '91234567003',
      },
    ]);

    agentIds = agents.map(a => new mongoose.Types.ObjectId(a._id));
  });

  describe('getHierarchyByAgentId', () => {
    it('should return hierarchies for an agent', async () => {
      const result = await hierarchyService.getHierarchyByAgentId(
        agentIds[2].toString(),
      );

      expect(result).toHaveProperty('hierarchies');
      expect(Array.isArray(result.hierarchies)).toBe(true);
      expect(result.hierarchies).toHaveLength(2); // Should include designations from levels 1 and 3
    });

    it('should throw error for non-existent agent', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      await expect(
        hierarchyService.getHierarchyByAgentId(nonExistentId),
      ).rejects.toThrow('Agent not found');
    });

    it('should return empty array for agent with no lower hierarchies', async () => {
      const result = await hierarchyService.getHierarchyByAgentId(
        agentIds[0].toString(),
      );

      expect(result).toHaveProperty('hierarchies');
      expect(Array.isArray(result.hierarchies)).toBe(true);
      expect(result.hierarchies).toHaveLength(0);
    });

    it('should handle agent with invalid designation', async () => {
      const agent = await AgentModel.create({
        userId: new mongoose.Types.ObjectId(),
        channelId,
        designationId: new mongoose.Types.ObjectId(),
        agentCode: 'AGT005',
        firstName: 'Test',
        lastName: 'User',
        agentStatus: 'active',
        email: 'test.user@example.com',
        phoneNumber: '01234567005',
      });

      await expect(
        hierarchyService.getHierarchyByAgentId(agent._id.toString()),
      ).rejects.toThrow('Designation not found');
    });

    it('should handle agent with invalid hierarchy', async () => {
      // Create designation with non-existent hierarchy
      const designation = await DesignationModel.create({
        channelId,
        hierarchyId: new mongoose.Types.ObjectId(),
        designationName: 'Invalid Hierarchy',
        designationCode: 'INV_H',
        roleId: new mongoose.Types.ObjectId(),
        designationStatus: 'active',
        designationOrder: 1,
      });

      const agent = await AgentModel.create({
        userId: new mongoose.Types.ObjectId(),
        channelId,
        designationId: designation._id,
        agentCode: 'AGT004',
        firstName: 'Test',
        lastName: 'User',
        agentStatus: 'active',
        email: 'test.user@example.com',
        phoneNumber: '91234567890',
      });

      await expect(
        hierarchyService.getHierarchyByAgentId(agent._id.toString()),
      ).rejects.toThrow('Hierarchy not found');
    });

    it('should handle deleted agent', async () => {
      const agent = await AgentModel.create({
        userId: new mongoose.Types.ObjectId(),
        channelId,
        designationId: designationIds[0],
        agentCode: 'AGT004',
        firstName: 'Deleted',
        lastName: 'User',
        agentStatus: 'active',
        email: 'deleted.user@example.com',
        phoneNumber: '01234567004',
      });

      await AgentModel.findByIdAndUpdate(agent._id, {
        isDeleted: true,
        deletedAt: new Date(),
      });

      await expect(
        hierarchyService.getHierarchyByAgentId(agent._id.toString()),
      ).rejects.toThrow('Agent not found');
    });

    it('should handle deleted designation', async () => {
      // Create designation and mark as deleted
      const designation = await DesignationModel.create({
        channelId,
        hierarchyId: hierarchyIds[0],
        designationName: 'Deleted Designation',
        designationCode: 'DEL_DSG',
        roleId: new mongoose.Types.ObjectId(),
        designationStatus: 'active',
        designationOrder: 1,
        isDeleted: true,
        deletedAt: new Date(),
      });

      const agent = await AgentModel.create({
        userId: new mongoose.Types.ObjectId(),
        channelId,
        designationId: designation._id,
        agentCode: 'AGT004',
        firstName: 'Test',
        lastName: 'User',
        agentStatus: 'active',
        email: 'test.user@example.com',
        phoneNumber: '91234567890',
      });

      await expect(
        hierarchyService.getHierarchyByAgentId(agent._id.toString()),
      ).rejects.toThrow('Designation not found');
    });

    it('should handle deleted hierarchy', async () => {
      // Create hierarchy and mark as deleted
      const hierarchy = await HierarchyModel.create({
        channelId,
        hierarchyName: 'Deleted Hierarchy',
        hierarchyLevelCode: '9',
        hierarchyLevel: 9,
        hierarchyStatus: 'active',
        hierarchyOrder: 9,
        isDeleted: true,
        deletedAt: new Date(),
      });

      const designation = await DesignationModel.create({
        channelId,
        hierarchyId: hierarchy._id,
        designationName: 'Test Designation',
        designationCode: 'TEST_DSG',
        roleId: new mongoose.Types.ObjectId(),
        designationStatus: 'active',
        designationOrder: 1,
      });

      const agent = await AgentModel.create({
        userId: new mongoose.Types.ObjectId(),
        channelId,
        designationId: designation._id,
        agentCode: 'AGT004',
        firstName: 'Test',
        lastName: 'User',
        agentStatus: 'active',
        email: 'test.user@example.com',
        phoneNumber: '91234567890',
      });

      await expect(
        hierarchyService.getHierarchyByAgentId(agent._id.toString()),
      ).rejects.toThrow('Hierarchy not found');
    });

    it('should handle malformed agent ID', async () => {
      await expect(
        hierarchyService.getHierarchyByAgentId('invalid-id'),
      ).rejects.toThrow('Invalid agent ID');
    });

    it('should handle agent with inactive status', async () => {
      const agent = await AgentModel.create({
        userId: new mongoose.Types.ObjectId(),
        channelId,
        designationId: designationIds[0],
        agentCode: 'AGT006',
        firstName: 'Inactive',
        lastName: 'User',
        agentStatus: 'inactive',
        email: 'inactive.user@example.com',
        phoneNumber: '91234567006',
      });

      await expect(
        hierarchyService.getHierarchyByAgentId(agent._id.toString()),
      ).rejects.toThrow('Agent is not active');
    });

    it('should handle agent with suspended status', async () => {
      const agent = await AgentModel.create({
        userId: new mongoose.Types.ObjectId(),
        channelId,
        designationId: designationIds[0],
        agentCode: 'AGT007',
        firstName: 'Suspended',
        lastName: 'User',
        agentStatus: 'suspended',
        email: 'suspended.user@example.com',
        phoneNumber: '01234567007',
      });

      await expect(
        hierarchyService.getHierarchyByAgentId(agent._id.toString()),
      ).rejects.toThrow('Agent is not active');
    });

    it('should handle database error when finding agent', async () => {
      // Mock findOne to throw error
      jest.spyOn(AgentModel, 'findOne').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      await expect(
        hierarchyService.getHierarchyByAgentId(agentIds[0].toString()),
      ).rejects.toThrow('Database error');
    });

    it('should handle database error when finding designation', async () => {
      // Mock findOne to throw error for designation
      jest.spyOn(DesignationModel, 'findOne').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      await expect(
        hierarchyService.getHierarchyByAgentId(agentIds[0].toString()),
      ).rejects.toThrow('Database error');
    });

    it('should handle database error when finding hierarchy', async () => {
      // Mock findOne to throw error for hierarchy
      jest.spyOn(HierarchyModel, 'findOne').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      await expect(
        hierarchyService.getHierarchyByAgentId(agentIds[0].toString()),
      ).rejects.toThrow('Database error');
    });
  });

  describe('getAgentsByHierarchyDesignation', () => {
    it('should return agents under a designation hierarchy', async () => {
      const result = await hierarchyService.getAgentsByHierarchyDesignation(
        channelId.toString(),
        'Manager L5',
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('fullName');
    });

    it('should throw error for non-existent designation', async () => {
      await expect(
        hierarchyService.getAgentsByHierarchyDesignation(
          channelId.toString(),
          'Non Existent',
        ),
      ).rejects.toThrow('Designation not found');
    });

    it('should return empty array for designation with no lower hierarchies', async () => {
      const result = await hierarchyService.getAgentsByHierarchyDesignation(
        channelId.toString(),
        'Manager L1',
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it('should handle invalid channel ID', async () => {
      const invalidChannelId = 'invalid-id';

      await expect(
        hierarchyService.getAgentsByHierarchyDesignation(
          invalidChannelId,
          'Manager L5',
        ),
      ).rejects.toThrow('Invalid channel ID');
    });

    it('should handle designation with inactive hierarchy', async () => {
      // Create hierarchy with inactive status
      const inactiveHierarchy = await HierarchyModel.create({
        channelId,
        hierarchyName: 'Inactive Level',
        hierarchyLevelCode: '6',
        hierarchyLevel: 6,
        hierarchyStatus: 'inactive',
        hierarchyOrder: 6,
      });

      // Create designation for inactive hierarchy
      const inactiveDesignation = await DesignationModel.create({
        channelId,
        hierarchyId: inactiveHierarchy._id,
        designationName: 'Inactive Manager',
        designationCode: 'INACT_MGR',
        roleId: new mongoose.Types.ObjectId(),
        designationStatus: 'active',
        designationOrder: 6,
      });

      // Create agent with inactive designation
      await AgentModel.create({
        userId: new mongoose.Types.ObjectId(),
        channelId,
        designationId: inactiveDesignation._id,
        agentCode: 'AGT004',
        firstName: 'Inactive',
        lastName: 'User',
        agentStatus: 'active',
        email: 'inactive.user@example.com',
        phoneNumber: '01234567004',
      });

      const result = await hierarchyService.getAgentsByHierarchyDesignation(
        channelId.toString(),
        'Inactive Manager',
      );

      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle designation with inactive status', async () => {
      // Create designation with inactive status
      const inactiveDesignation = await DesignationModel.create({
        channelId,
        hierarchyId: hierarchyIds[0],
        designationName: 'Inactive Designation',
        designationCode: 'INACT_DSG',
        roleId: new mongoose.Types.ObjectId(),
        designationStatus: 'inactive',
        designationOrder: 7,
      });

      // Create agent with inactive designation
      await AgentModel.create({
        userId: new mongoose.Types.ObjectId(),
        channelId,
        designationId: inactiveDesignation._id,
        agentCode: 'AGT005',
        firstName: 'Inactive',
        lastName: 'Designation',
        agentStatus: 'active',
        email: 'inactive.designation@example.com',
        phoneNumber: '91234567890',
      });

      const result = await hierarchyService.getAgentsByHierarchyDesignation(
        channelId.toString(),
        'Inactive Designation',
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it('should handle deleted agents', async () => {
      // Mark an agent as deleted
      await AgentModel.findByIdAndUpdate(agentIds[0], {
        isDeleted: true,
        deletedAt: new Date(),
      });

      const result = await hierarchyService.getAgentsByHierarchyDesignation(
        channelId.toString(),
        'Manager L5',
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1); // Should only include non-deleted agents
    });

    it('should handle agents with inactive status', async () => {
      await AgentModel.create({
        userId: new mongoose.Types.ObjectId(),
        channelId,
        designationId: designationIds[0],
        agentCode: 'AGT008',
        firstName: 'Inactive',
        lastName: 'User',
        agentStatus: 'inactive',
        email: 'inactive.status@example.com',
        phoneNumber: '91234567008',
      });

      const result = await hierarchyService.getAgentsByHierarchyDesignation(
        channelId.toString(),
        'Manager L5',
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.every(agent => !agent.fullName.includes('Inactive'))).toBe(
        true,
      );
    });

    it('should handle agents with suspended status', async () => {
      await AgentModel.create({
        userId: new mongoose.Types.ObjectId(),
        channelId,
        designationId: designationIds[0],
        agentCode: 'AGT009',
        firstName: 'Suspended',
        lastName: 'User',
        agentStatus: 'suspended',
        email: 'suspended.status@example.com',
        phoneNumber: '01234567009',
      });

      const result = await hierarchyService.getAgentsByHierarchyDesignation(
        channelId.toString(),
        'Manager L5',
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.every(agent => !agent.fullName.includes('Suspended'))).toBe(
        true,
      );
    });

    it('should handle designation with multiple agents having same hierarchy level', async () => {
      await Promise.all([
        AgentModel.create({
          userId: new mongoose.Types.ObjectId(),
          channelId,
          designationId: designationIds[0],
          agentCode: 'AGT011',
          firstName: 'Same',
          lastName: 'Level1',
          agentStatus: 'active',
          email: 'same.level1@example.com',
          phoneNumber: '01234567011',
        }),
        AgentModel.create({
          userId: new mongoose.Types.ObjectId(),
          channelId,
          designationId: designationIds[0],
          agentCode: 'AGT012',
          firstName: 'Same',
          lastName: 'Level2',
          agentStatus: 'active',
          email: 'same.level2@example.com',
          phoneNumber: '91234567012',
        }),
      ]);

      const result = await hierarchyService.getAgentsByHierarchyDesignation(
        channelId.toString(),
        'Manager L5',
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle database error when finding agents', async () => {
      // Mock a database error
      jest.spyOn(AgentModel, 'find').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      await expect(
        hierarchyService.getAgentsByHierarchyDesignation(
          channelId.toString(),
          'Manager L5',
        ),
      ).rejects.toThrow('Database error');
    });

    it('should handle empty designation name', async () => {
      await expect(
        hierarchyService.getAgentsByHierarchyDesignation(
          channelId.toString(),
          '',
        ),
      ).rejects.toThrow('Designation name is required');
    });

    it('should handle whitespace-only designation name', async () => {
      await expect(
        hierarchyService.getAgentsByHierarchyDesignation(
          channelId.toString(),
          '   ',
        ),
      ).rejects.toThrow('Designation name is required');
    });

    it('should handle empty channel ID', async () => {
      await expect(
        hierarchyService.getAgentsByHierarchyDesignation('', 'Manager L5'),
      ).rejects.toThrow('Channel ID is required');
    });

    it('should handle whitespace-only channel ID', async () => {
      await expect(
        hierarchyService.getAgentsByHierarchyDesignation('   ', 'Manager L5'),
      ).rejects.toThrow('Channel ID is required');
    });

    it('should handle designation with no agents', async () => {
      // Create a new designation without any agents
      await DesignationModel.create({
        channelId,
        hierarchyId: hierarchyIds[0],
        designationName: 'Empty Designation',
        designationCode: 'EMPTY_DSG',
        roleId: new mongoose.Types.ObjectId(),
        designationStatus: 'active',
        designationOrder: 1,
      });

      const result = await hierarchyService.getAgentsByHierarchyDesignation(
        channelId.toString(),
        'Empty Designation',
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });
});
