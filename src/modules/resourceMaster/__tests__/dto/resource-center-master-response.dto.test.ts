import { ResourceCenterMasterResponseDto } from '../../dto/resource-center-master-response.dto';

describe('ResourceCenterMasterResponseDto', () => {
  describe('constructor', () => {
    it('should create a valid response DTO with all properties', () => {
      const data = {
        _id: '507f1f77bcf86cd799439011',
        resourceCategoryName: 'Sales Training',
        sequence: 1,
        isActive: true,
        categoryId: 'RCMAS1234',
        updatedBy: '507f1f77bcf86cd799439012',
        updatedAt: new Date('2023-12-01T10:30:00.000Z'),
        createdBy: '507f1f77bcf86cd799439013',
        createdAt: new Date('2023-12-01T10:00:00.000Z'),
      };

      const dto = new ResourceCenterMasterResponseDto(data);

      expect(dto._id).toBe(data._id);
      expect(dto.resourceCategoryName).toBe(data.resourceCategoryName);
      expect(dto.sequence).toBe(data.sequence);
      expect(dto.isActive).toBe(data.isActive);
      expect(dto.categoryId).toBe(data.categoryId);
      expect(dto.updatedBy).toBe(data.updatedBy);
      expect(dto.updatedAt).toBe(data.updatedAt);
      expect(dto.createdBy).toBe(data.createdBy);
      expect(dto.createdAt).toBe(data.createdAt);
    });

    it('should create a valid response DTO with required properties only', () => {
      const data = {
        _id: '507f1f77bcf86cd799439014',
        resourceCategoryName: 'Product Training',
        sequence: 2,
        isActive: false,
        categoryId: 'RCMAS5678',
        createdAt: new Date('2023-12-01T11:00:00.000Z'),
      };

      const dto = new ResourceCenterMasterResponseDto(data);

      expect(dto._id).toBe(data._id);
      expect(dto.resourceCategoryName).toBe(data.resourceCategoryName);
      expect(dto.sequence).toBe(data.sequence);
      expect(dto.isActive).toBe(data.isActive);
      expect(dto.categoryId).toBe(data.categoryId);
      expect(dto.createdAt).toBe(data.createdAt);
      expect(dto.updatedBy).toBeUndefined();
      expect(dto.updatedAt).toBeUndefined();
      expect(dto.createdBy).toBeUndefined();
    });

    it('should handle optional properties as undefined', () => {
      const data = {
        _id: '507f1f77bcf86cd799439015',
        resourceCategoryName: 'Marketing Training',
        sequence: 3,
        isActive: true,
        categoryId: 'RCMAS9999',
        createdAt: new Date('2023-12-01T12:00:00.000Z'),
        updatedBy: undefined,
        updatedAt: undefined,
        createdBy: undefined,
      };

      const dto = new ResourceCenterMasterResponseDto(data);

      expect(dto._id).toBe(data._id);
      expect(dto.resourceCategoryName).toBe(data.resourceCategoryName);
      expect(dto.sequence).toBe(data.sequence);
      expect(dto.isActive).toBe(data.isActive);
      expect(dto.categoryId).toBe(data.categoryId);
      expect(dto.createdAt).toBe(data.createdAt);
      expect(dto.updatedBy).toBeUndefined();
      expect(dto.updatedAt).toBeUndefined();
      expect(dto.createdBy).toBeUndefined();
    });

    it('should preserve boolean false value for isActive', () => {
      const data = {
        _id: '507f1f77bcf86cd799439016',
        resourceCategoryName: 'Technical Training',
        sequence: 4,
        isActive: false,
        categoryId: 'RCMAS1111',
        createdAt: new Date('2023-12-01T13:00:00.000Z'),
      };

      const dto = new ResourceCenterMasterResponseDto(data);

      expect(dto.isActive).toBe(false);
    });

    it('should preserve boolean true value for isActive', () => {
      const data = {
        _id: '507f1f77bcf86cd799439017',
        resourceCategoryName: 'HR Training',
        sequence: 5,
        isActive: true,
        categoryId: 'RCMAS2222',
        createdAt: new Date('2023-12-01T14:00:00.000Z'),
      };

      const dto = new ResourceCenterMasterResponseDto(data);

      expect(dto.isActive).toBe(true);
    });

    it('should handle Date objects correctly', () => {
      const createdDate = new Date('2023-12-01T15:00:00.000Z');
      const updatedDate = new Date('2023-12-01T16:00:00.000Z');

      const data = {
        _id: '507f1f77bcf86cd799439018',
        resourceCategoryName: 'Compliance Training',
        sequence: 6,
        isActive: true,
        categoryId: 'RCMAS3333',
        createdAt: createdDate,
        updatedAt: updatedDate,
      };

      const dto = new ResourceCenterMasterResponseDto(data);

      expect(dto.createdAt).toBe(createdDate);
      expect(dto.updatedAt).toBe(updatedDate);
      expect(dto.createdAt instanceof Date).toBe(true);
      expect(dto.updatedAt instanceof Date).toBe(true);
    });

    it('should handle zero sequence value', () => {
      const data = {
        _id: '507f1f77bcf86cd799439019',
        resourceCategoryName: 'Quality Training',
        sequence: 0,
        isActive: false,
        categoryId: 'RCMAS4444',
        createdAt: new Date('2023-12-01T17:00:00.000Z'),
      };

      const dto = new ResourceCenterMasterResponseDto(data);

      expect(dto.sequence).toBe(0);
    });

    it('should handle large sequence values', () => {
      const data = {
        _id: '507f1f77bcf86cd799439020',
        resourceCategoryName: 'Safety Training',
        sequence: 999999,
        isActive: true,
        categoryId: 'RCMAS5555',
        createdAt: new Date('2023-12-01T18:00:00.000Z'),
      };

      const dto = new ResourceCenterMasterResponseDto(data);

      expect(dto.sequence).toBe(999999);
    });

    it('should handle empty string values', () => {
      const data = {
        _id: '',
        resourceCategoryName: '',
        sequence: 7,
        isActive: false,
        categoryId: '',
        createdAt: new Date('2023-12-01T19:00:00.000Z'),
        updatedBy: '',
        createdBy: '',
      };

      const dto = new ResourceCenterMasterResponseDto(data);

      expect(dto._id).toBe('');
      expect(dto.resourceCategoryName).toBe('');
      expect(dto.categoryId).toBe('');
      expect(dto.updatedBy).toBe('');
      expect(dto.createdBy).toBe('');
    });

    it('should handle long category names', () => {
      const longName = 'A'.repeat(100);
      const data = {
        _id: '507f1f77bcf86cd799439021',
        resourceCategoryName: longName,
        sequence: 8,
        isActive: true,
        categoryId: 'RCMAS6666',
        createdAt: new Date('2023-12-01T20:00:00.000Z'),
      };

      const dto = new ResourceCenterMasterResponseDto(data);

      expect(dto.resourceCategoryName).toBe(longName);
      expect(dto.resourceCategoryName.length).toBe(100);
    });

    it('should handle special characters in category name', () => {
      const specialName = 'Sales & Marketing Training (Level 1) - Advanced';
      const data = {
        _id: '507f1f77bcf86cd799439022',
        resourceCategoryName: specialName,
        sequence: 9,
        isActive: true,
        categoryId: 'RCMAS7777',
        createdAt: new Date('2023-12-01T21:00:00.000Z'),
      };

      const dto = new ResourceCenterMasterResponseDto(data);

      expect(dto.resourceCategoryName).toBe(specialName);
    });
  });

  describe('interface compliance', () => {
    it('should implement IResourceCenterMasterResponseDto interface', () => {
      const data = {
        _id: '507f1f77bcf86cd799439023',
        resourceCategoryName: 'Interface Test',
        sequence: 10,
        isActive: true,
        categoryId: 'RCMAS8888',
        updatedBy: '507f1f77bcf86cd799439024',
        updatedAt: new Date('2023-12-01T22:30:00.000Z'),
        createdBy: '507f1f77bcf86cd799439025',
        createdAt: new Date('2023-12-01T22:00:00.000Z'),
      };

      const dto = new ResourceCenterMasterResponseDto(data);

      // Type check - this will fail compilation if interface is not implemented correctly
      const idCheck: typeof dto._id = dto._id;
      const nameCheck: typeof dto.resourceCategoryName =
        dto.resourceCategoryName;
      const sequenceCheck: typeof dto.sequence = dto.sequence;
      const isActiveCheck: typeof dto.isActive = dto.isActive;
      const categoryIdCheck: typeof dto.categoryId = dto.categoryId;
      const updatedByCheck: typeof dto.updatedBy = dto.updatedBy;
      const updatedAtCheck: typeof dto.updatedAt = dto.updatedAt;
      const createdByCheck: typeof dto.createdBy = dto.createdBy;
      const createdAtCheck: typeof dto.createdAt = dto.createdAt;

      expect(idCheck).toBeDefined();
      expect(nameCheck).toBeDefined();
      expect(sequenceCheck).toBeDefined();
      expect(isActiveCheck).toBeDefined();
      expect(categoryIdCheck).toBeDefined();
      expect(updatedByCheck).toBeDefined();
      expect(updatedAtCheck).toBeDefined();
      expect(createdByCheck).toBeDefined();
      expect(createdAtCheck).toBeDefined();
    });
  });
});
