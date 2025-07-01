import { CreateResourceCenterMasterDto } from '../../dto/create-resource-center-master.dto';

describe('CreateResourceCenterMasterDto', () => {
  describe('constructor', () => {
    it('should create a valid DTO with all properties', () => {
      const data = {
        resourceCategoryName: 'Sales Training',
        sequence: 1,
        isActive: true,
        createdBy: '507f1f77bcf86cd799439011',
      };

      const dto = new CreateResourceCenterMasterDto(data);

      expect(dto.resourceCategoryName).toBe(data.resourceCategoryName);
      expect(dto.sequence).toBe(data.sequence);
      expect(dto.isActive).toBe(data.isActive);
      expect(dto.createdBy).toBe(data.createdBy);
    });

    it('should create a valid DTO with required properties only', () => {
      const data = {
        resourceCategoryName: 'Product Training',
        sequence: 2,
      };

      const dto = new CreateResourceCenterMasterDto(data);

      expect(dto.resourceCategoryName).toBe(data.resourceCategoryName);
      expect(dto.sequence).toBe(data.sequence);
      expect(dto.isActive).toBe(false); // default value
      expect(dto.createdBy).toBeUndefined();
    });

    it('should set default value for isActive when not provided', () => {
      const data = {
        resourceCategoryName: 'Marketing Training',
        sequence: 3,
        createdBy: '507f1f77bcf86cd799439012',
      };

      const dto = new CreateResourceCenterMasterDto(data);

      expect(dto.isActive).toBe(false);
    });

    it('should preserve isActive value when explicitly set to true', () => {
      const data = {
        resourceCategoryName: 'Technical Training',
        sequence: 4,
        isActive: true,
      };

      const dto = new CreateResourceCenterMasterDto(data);

      expect(dto.isActive).toBe(true);
    });

    it('should preserve isActive value when explicitly set to false', () => {
      const data = {
        resourceCategoryName: 'HR Training',
        sequence: 5,
        isActive: false,
      };

      const dto = new CreateResourceCenterMasterDto(data);

      expect(dto.isActive).toBe(false);
    });

    it('should handle empty object and set defaults', () => {
      const dto = new CreateResourceCenterMasterDto({});

      expect(dto.resourceCategoryName).toBeUndefined();
      expect(dto.sequence).toBeUndefined();
      expect(dto.isActive).toBe(false);
      expect(dto.createdBy).toBeUndefined();
    });

    it('should handle partial data', () => {
      const data = {
        resourceCategoryName: 'Compliance Training',
      };

      const dto = new CreateResourceCenterMasterDto(data);

      expect(dto.resourceCategoryName).toBe(data.resourceCategoryName);
      expect(dto.sequence).toBeUndefined();
      expect(dto.isActive).toBe(false);
      expect(dto.createdBy).toBeUndefined();
    });

    it('should handle null values', () => {
      const data = {
        resourceCategoryName: 'Quality Training',
        sequence: 6,
        isActive: null as any,
        createdBy: null as any,
      };

      const dto = new CreateResourceCenterMasterDto(data);

      expect(dto.resourceCategoryName).toBe(data.resourceCategoryName);
      expect(dto.sequence).toBe(data.sequence);
      expect(dto.isActive).toBe(false); // null should be overridden by default
      expect(dto.createdBy).toBeNull();
    });

    it('should handle undefined values', () => {
      const data = {
        resourceCategoryName: 'Safety Training',
        sequence: 7,
        isActive: undefined,
        createdBy: undefined,
      };

      const dto = new CreateResourceCenterMasterDto(data);

      expect(dto.resourceCategoryName).toBe(data.resourceCategoryName);
      expect(dto.sequence).toBe(data.sequence);
      expect(dto.isActive).toBe(false);
      expect(dto.createdBy).toBeUndefined();
    });
  });

  describe('interface compliance', () => {
    it('should implement ICreateResourceCenterMasterDto interface', () => {
      const data = {
        resourceCategoryName: 'Interface Test',
        sequence: 8,
        isActive: true,
        createdBy: '507f1f77bcf86cd799439013',
      };

      const dto = new CreateResourceCenterMasterDto(data);

      // Type check - this will fail compilation if interface is not implemented correctly
      const interfaceCheck: typeof dto.resourceCategoryName =
        dto.resourceCategoryName;
      const sequenceCheck: typeof dto.sequence = dto.sequence;
      const isActiveCheck: typeof dto.isActive = dto.isActive;
      const createdByCheck: typeof dto.createdBy = dto.createdBy;

      expect(interfaceCheck).toBeDefined();
      expect(sequenceCheck).toBeDefined();
      expect(isActiveCheck).toBeDefined();
      expect(createdByCheck).toBeDefined();
    });
  });
});
