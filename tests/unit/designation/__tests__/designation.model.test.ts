import { DesignationModel } from '@/models/designation.model';
import { Types } from 'mongoose';
import {
  setupTestDB,
  teardownTestDB,
  clearTestDB,
} from '../../models/__tests__/setup';

describe('DesignationModel', () => {
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
    it('should create a valid designation', async () => {
      const validDesignation = new DesignationModel({
        channelId: new Types.ObjectId(),
        roleId: new Types.ObjectId(),
        hierarchyId: new Types.ObjectId(),
        designationName: 'Test Designation',
        designationCode: 'TEST_DESIG',
        designationStatus: 'active',
        designationDescription: 'Test Description',
        designationOrder: 1,
      });

      const validationError = validDesignation.validateSync();
      expect(validationError).toBeUndefined();

      const savedDesignation = await validDesignation.save();
      expect(savedDesignation._id).toBeDefined();
    });

    it('should require channelId', () => {
      const invalidDesignation = new DesignationModel({
        roleId: new Types.ObjectId(),
        hierarchyId: new Types.ObjectId(),
        designationName: 'Test Designation',
        designationCode: 'TEST_DESIG',
        designationStatus: 'active',
        designationOrder: 1,
      });

      const validationError = invalidDesignation.validateSync();
      expect(validationError?.errors.channelId).toBeDefined();
      expect(validationError?.errors.channelId.message).toBe(
        'Channel ID is required',
      );
    });

    it('should require roleId', () => {
      const invalidDesignation = new DesignationModel({
        channelId: new Types.ObjectId(),
        hierarchyId: new Types.ObjectId(),
        designationName: 'Test Designation',
        designationCode: 'TEST_DESIG',
        designationStatus: 'active',
        designationOrder: 1,
      });

      const validationError = invalidDesignation.validateSync();
      expect(validationError?.errors.roleId).toBeDefined();
      expect(validationError?.errors.roleId.message).toBe(
        'Role ID is required',
      );
    });

    it('should require hierarchyId', () => {
      const invalidDesignation = new DesignationModel({
        channelId: new Types.ObjectId(),
        roleId: new Types.ObjectId(),
        designationName: 'Test Designation',
        designationCode: 'TEST_DESIG',
        designationStatus: 'active',
        designationOrder: 1,
      });

      const validationError = invalidDesignation.validateSync();
      expect(validationError?.errors.hierarchyId).toBeDefined();
      expect(validationError?.errors.hierarchyId.message).toBe(
        'Hierarchy ID is required',
      );
    });

    it('should require designationName', () => {
      const invalidDesignation = new DesignationModel({
        channelId: new Types.ObjectId(),
        roleId: new Types.ObjectId(),
        hierarchyId: new Types.ObjectId(),
        designationCode: 'TEST_DESIG',
        designationStatus: 'active',
        designationOrder: 1,
      });

      const validationError = invalidDesignation.validateSync();
      expect(validationError?.errors.designationName).toBeDefined();
      expect(validationError?.errors.designationName.message).toBe(
        'Designation name is required',
      );
    });

    it('should require designationCode', () => {
      const invalidDesignation = new DesignationModel({
        channelId: new Types.ObjectId(),
        roleId: new Types.ObjectId(),
        hierarchyId: new Types.ObjectId(),
        designationName: 'Test Designation',
        designationStatus: 'active',
        designationOrder: 1,
      });

      const validationError = invalidDesignation.validateSync();
      expect(validationError?.errors.designationCode).toBeDefined();
      expect(validationError?.errors.designationCode.message).toBe(
        'Designation code is required',
      );
    });

    it('should set default values correctly', () => {
      const designation = new DesignationModel({
        channelId: new Types.ObjectId(),
        roleId: new Types.ObjectId(),
        hierarchyId: new Types.ObjectId(),
        designationName: 'Test Designation',
        designationCode: 'TEST_DESIG',
        designationOrder: 1,
      });

      expect(designation.isDeleted).toBe(false);
      expect(designation.deletedAt).toBeNull();
      expect(designation.designationStatus).toBe('active');
      expect(designation.designationDescription).toBeUndefined();
    });

    it('should validate designationCode format', () => {
      const invalidDesignation = new DesignationModel({
        channelId: new Types.ObjectId(),
        roleId: new Types.ObjectId(),
        hierarchyId: new Types.ObjectId(),
        designationName: 'Test Designation',
        designationCode: 'invalid code',
        designationStatus: 'active',
        designationOrder: 1,
      });

      const validationError = invalidDesignation.validateSync();
      expect(validationError?.errors.designationCode).toBeDefined();
      expect(validationError?.errors.designationCode.message).toBe(
        'Designation code cannot exceed 10 characters',
      );
    });

    it('should validate designationStatus values', () => {
      const invalidDesignation = new DesignationModel({
        channelId: new Types.ObjectId(),
        roleId: new Types.ObjectId(),
        hierarchyId: new Types.ObjectId(),
        designationName: 'Test Designation',
        designationCode: 'TEST_DESIG',
        designationStatus: 'invalid',
        designationOrder: 1,
      });

      const validationError = invalidDesignation.validateSync();
      expect(validationError?.errors.designationStatus).toBeDefined();
      expect(validationError?.errors.designationStatus.message).toBe(
        'Status must be either active or inactive',
      );
    });

    it('should validate designationOrder is not negative', () => {
      const invalidDesignation = new DesignationModel({
        channelId: new Types.ObjectId(),
        roleId: new Types.ObjectId(),
        hierarchyId: new Types.ObjectId(),
        designationName: 'Test Designation',
        designationCode: 'TEST_DESIG',
        designationStatus: 'active',
        designationOrder: -1,
      });

      const validationError = invalidDesignation.validateSync();
      expect(validationError?.errors.designationOrder).toBeDefined();
      expect(validationError?.errors.designationOrder.message).toBe(
        'Designation order cannot be negative',
      );
    });
  });
});
