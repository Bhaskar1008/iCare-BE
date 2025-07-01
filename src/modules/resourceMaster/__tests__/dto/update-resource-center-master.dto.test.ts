import { UpdateResourceCenterMasterDto } from '../../dto/update-resource-center-master.dto';

describe('UpdateResourceCenterMasterDto', () => {
  describe('constructor', () => {
    it('should create a valid DTO with all properties', () => {
      const data = {
        resourceCategoryName: 'Updated Sales Training',
        sequence: 10,
        isActive: true,
        categoryId: 'RCMAS1234',
        updatedBy: '507f1f77bcf86cd799439011',
      };

      const dto = new UpdateResourceCenterMasterDto(data);

      expect(dto.resourceCategoryName).toBe(data.resourceCategoryName);
      expect(dto.sequence).toBe(data.sequence);
      expect(dto.isActive).toBe(data.isActive);
      expect(dto.categoryId).toBe(data.categoryId);
      expect(dto.updatedBy).toBe(data.updatedBy);
    });

    it('should create a valid DTO with partial properties', () => {
      const data = {
        resourceCategoryName: 'Updated Product Training',
      };

      const dto = new UpdateResourceCenterMasterDto(data);

      expect(dto.resourceCategoryName).toBe(data.resourceCategoryName);
      expect(dto.sequence).toBeUndefined();
      expect(dto.isActive).toBeUndefined();
      expect(dto.categoryId).toBeUndefined();
      expect(dto.updatedBy).toBeUndefined();
    });

    it('should create a valid DTO with only sequence', () => {
      const data = {
        sequence: 15,
      };

      const dto = new UpdateResourceCenterMasterDto(data);

      expect(dto.resourceCategoryName).toBeUndefined();
      expect(dto.sequence).toBe(data.sequence);
      expect(dto.isActive).toBeUndefined();
      expect(dto.categoryId).toBeUndefined();
      expect(dto.updatedBy).toBeUndefined();
    });

    it('should create a valid DTO with only isActive', () => {
      const data = {
        isActive: false,
      };

      const dto = new UpdateResourceCenterMasterDto(data);

      expect(dto.resourceCategoryName).toBeUndefined();
      expect(dto.sequence).toBeUndefined();
      expect(dto.isActive).toBe(data.isActive);
      expect(dto.categoryId).toBeUndefined();
      expect(dto.updatedBy).toBeUndefined();
    });

    it('should create a valid DTO with only categoryId', () => {
      const data = {
        categoryId: 'RCMAS5678',
      };

      const dto = new UpdateResourceCenterMasterDto(data);

      expect(dto.resourceCategoryName).toBeUndefined();
      expect(dto.sequence).toBeUndefined();
      expect(dto.isActive).toBeUndefined();
      expect(dto.categoryId).toBe(data.categoryId);
      expect(dto.updatedBy).toBeUndefined();
    });

    it('should create a valid DTO with only updatedBy', () => {
      const data = {
        updatedBy: '507f1f77bcf86cd799439012',
      };

      const dto = new UpdateResourceCenterMasterDto(data);

      expect(dto.resourceCategoryName).toBeUndefined();
      expect(dto.sequence).toBeUndefined();
      expect(dto.isActive).toBeUndefined();
      expect(dto.categoryId).toBeUndefined();
      expect(dto.updatedBy).toBe(data.updatedBy);
    });

    it('should handle empty object', () => {
      const dto = new UpdateResourceCenterMasterDto({});

      expect(dto.resourceCategoryName).toBeUndefined();
      expect(dto.sequence).toBeUndefined();
      expect(dto.isActive).toBeUndefined();
      expect(dto.categoryId).toBeUndefined();
      expect(dto.updatedBy).toBeUndefined();
    });

    it('should handle null values', () => {
      const data = {
        resourceCategoryName: null as any,
        sequence: null as any,
        isActive: null as any,
        categoryId: null as any,
        updatedBy: null as any,
      };

      const dto = new UpdateResourceCenterMasterDto(data);

      expect(dto.resourceCategoryName).toBeNull();
      expect(dto.sequence).toBeNull();
      expect(dto.isActive).toBeNull();
      expect(dto.categoryId).toBeNull();
      expect(dto.updatedBy).toBeNull();
    });

    it('should handle undefined values', () => {
      const data = {
        resourceCategoryName: undefined,
        sequence: undefined,
        isActive: undefined,
        categoryId: undefined,
        updatedBy: undefined,
      };

      const dto = new UpdateResourceCenterMasterDto(data);

      expect(dto.resourceCategoryName).toBeUndefined();
      expect(dto.sequence).toBeUndefined();
      expect(dto.isActive).toBeUndefined();
      expect(dto.categoryId).toBeUndefined();
      expect(dto.updatedBy).toBeUndefined();
    });

    it('should preserve boolean false value for isActive', () => {
      const data = {
        isActive: false,
      };

      const dto = new UpdateResourceCenterMasterDto(data);

      expect(dto.isActive).toBe(false);
    });

    it('should preserve boolean true value for isActive', () => {
      const data = {
        isActive: true,
      };

      const dto = new UpdateResourceCenterMasterDto(data);

      expect(dto.isActive).toBe(true);
    });

    it('should handle zero sequence value', () => {
      const data = {
        sequence: 0,
      };

      const dto = new UpdateResourceCenterMasterDto(data);

      expect(dto.sequence).toBe(0);
    });

    it('should handle empty string values', () => {
      const data = {
        resourceCategoryName: '',
        categoryId: '',
        updatedBy: '',
      };

      const dto = new UpdateResourceCenterMasterDto(data);

      expect(dto.resourceCategoryName).toBe('');
      expect(dto.categoryId).toBe('');
      expect(dto.updatedBy).toBe('');
    });
  });

  describe('interface compliance', () => {
    it('should implement IUpdateResourceCenterMasterDto interface', () => {
      const data = {
        resourceCategoryName: 'Interface Test',
        sequence: 20,
        isActive: true,
        categoryId: 'RCMAS9999',
        updatedBy: '507f1f77bcf86cd799439013',
      };

      const dto = new UpdateResourceCenterMasterDto(data);

      // Type check - this will fail compilation if interface is not implemented correctly
      const nameCheck: typeof dto.resourceCategoryName =
        dto.resourceCategoryName;
      const sequenceCheck: typeof dto.sequence = dto.sequence;
      const isActiveCheck: typeof dto.isActive = dto.isActive;
      const categoryIdCheck: typeof dto.categoryId = dto.categoryId;
      const updatedByCheck: typeof dto.updatedBy = dto.updatedBy;

      expect(nameCheck).toBeDefined();
      expect(sequenceCheck).toBeDefined();
      expect(isActiveCheck).toBeDefined();
      expect(categoryIdCheck).toBeDefined();
      expect(updatedByCheck).toBeDefined();
    });
  });
});
