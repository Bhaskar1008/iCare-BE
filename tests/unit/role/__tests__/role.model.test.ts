import { RoleModel } from '@/models/role.model';
import { Types } from 'mongoose';
import {
  setupTestDB,
  teardownTestDB,
  clearTestDB,
} from '../../models/__tests__/setup';

describe('RoleModel', () => {
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
    it('should create a valid role', () => {
      const validRole = new RoleModel({
        channelId: new Types.ObjectId(),
        roleName: 'Test Role',
        roleCode: 123,
        description: 'Test Role Description',
        permissions: [new Types.ObjectId()],
        isSystem: false,
        status: 'active',
      });

      const validationError = validRole.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('should require channelId', () => {
      const invalidRole = new RoleModel({
        roleName: 'Test Role',
        roleCode: 123,
        description: 'Test Role Description',
        permissions: [new Types.ObjectId()],
        isSystem: false,
        status: 'active',
      });

      const validationError = invalidRole.validateSync();
      expect(validationError?.errors.channelId).toBeDefined();
      expect(validationError?.errors.channelId.message).toBe(
        'Channel ID is required',
      );
    });

    it('should require roleName', () => {
      const invalidRole = new RoleModel({
        channelId: new Types.ObjectId(),
        roleCode: 123,
        description: 'Test Role Description',
        permissions: [new Types.ObjectId()],
        isSystem: false,
        status: 'active',
      });

      const validationError = invalidRole.validateSync();
      expect(validationError?.errors.roleName).toBeDefined();
      expect(validationError?.errors.roleName.message).toBe(
        'Role name is required',
      );
    });

    it('should require roleCode', () => {
      const invalidRole = new RoleModel({
        channelId: new Types.ObjectId(),
        roleName: 'Test Role',
        description: 'Test Role Description',
        permissions: [new Types.ObjectId()],
        isSystem: false,
        status: 'active',
      });

      const validationError = invalidRole.validateSync();
      expect(validationError?.errors.roleCode).toBeDefined();
      expect(validationError?.errors.roleCode.message).toBe(
        'Role code is required',
      );
    });

    it('should set default values correctly', () => {
      const role = new RoleModel({
        channelId: new Types.ObjectId(),
        roleName: 'Test Role',
        roleCode: 123,
      });

      expect(role.isDeleted).toBe(false);
      expect(role.deletedAt).toBeNull();
      expect(role.status).toBe('active');
      expect(role.isSystem).toBe(false);
      expect(role.permissions).toEqual([]);
    });

    it('should validate roleCode minimum value', () => {
      const invalidRole = new RoleModel({
        channelId: new Types.ObjectId(),
        roleName: 'Test Role',
        roleCode: 0,
        status: 'active',
      });

      const validationError = invalidRole.validateSync();
      expect(validationError?.errors.roleCode).toBeDefined();
      expect(validationError?.errors.roleCode.message).toBe(
        'Role code must be positive',
      );
    });

    it('should validate roleCode maximum value', () => {
      const invalidRole = new RoleModel({
        channelId: new Types.ObjectId(),
        roleName: 'Test Role',
        roleCode: 1000000,
        status: 'active',
      });

      const validationError = invalidRole.validateSync();
      expect(validationError?.errors.roleCode).toBeDefined();
      expect(validationError?.errors.roleCode.message).toBe(
        'Role code cannot exceed 999999',
      );
    });

    it('should validate status values', () => {
      const invalidRole = new RoleModel({
        channelId: new Types.ObjectId(),
        roleName: 'Test Role',
        roleCode: 123,
        status: 'invalid',
      });

      const validationError = invalidRole.validateSync();
      expect(validationError?.errors.status).toBeDefined();
      expect(validationError?.errors.status.message).toBe(
        'Status must be active or inactive',
      );
    });

    it('should validate roleName maximum length', () => {
      const invalidRole = new RoleModel({
        channelId: new Types.ObjectId(),
        roleName: 'a'.repeat(101),
        roleCode: 123,
        status: 'active',
      });

      const validationError = invalidRole.validateSync();
      expect(validationError?.errors.roleName).toBeDefined();
      expect(validationError?.errors.roleName.message).toBe(
        'Role name cannot exceed 100 characters',
      );
    });

    it('should validate description maximum length', () => {
      const invalidRole = new RoleModel({
        channelId: new Types.ObjectId(),
        roleName: 'Test Role',
        roleCode: 123,
        description: 'a'.repeat(501),
        status: 'active',
      });

      const validationError = invalidRole.validateSync();
      expect(validationError?.errors.description).toBeDefined();
      expect(validationError?.errors.description.message).toBe(
        'Description cannot exceed 500 characters',
      );
    });
  });
});
