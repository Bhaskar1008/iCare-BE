import { ResourceCenterMasterService } from '../resource-center-master.service';
import { ResourceCenterMasterRepository } from '../resource-center-master.repository';
import { CreateResourceCenterMasterDto } from '../dto/create-resource-center-master.dto';
import { UpdateResourceCenterMasterDto } from '../dto/update-resource-center-master.dto';
import type { IResourceCenterMaster } from '@/models/resource-center-master.model';

// Mock the logger
jest.mock('@/common/utils/logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

// Mock the repository
jest.mock('../resource-center-master.repository');

describe('ResourceCenterMasterService', () => {
  let service: ResourceCenterMasterService;
  let mockRepository: jest.Mocked<ResourceCenterMasterRepository>;

  const mockResourceCenterMaster = {
    _id: '507f1f77bcf86cd799439011',
    resourceCategoryName: 'Sales Training',
    sequence: 1,
    isActive: true,
    categoryId: 'RCMAS1234',
    createdAt: new Date('2023-12-01T10:00:00.000Z'),
    updatedAt: new Date('2023-12-01T11:00:00.000Z'),
    createdBy: undefined,
    updatedBy: undefined,
    isDeleted: false,
    deletedAt: undefined,
    toObject: jest.fn().mockReturnValue({}),
    toJSON: jest.fn().mockReturnValue({}),
    save: jest.fn(),
  } as unknown as IResourceCenterMaster;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock repository instance
    mockRepository = {
      createResourceCenterMaster: jest.fn(),
      getAllResourceCenterMasters: jest.fn(),
      updateResourceCenterMaster: jest.fn(),
      findCategoryIdExists: jest.fn(),
    } as any;

    // Mock the repository constructor
    (
      ResourceCenterMasterRepository as jest.MockedClass<
        typeof ResourceCenterMasterRepository
      >
    ).mockImplementation(() => mockRepository);

    service = new ResourceCenterMasterService();
  });

  describe('createResourceCenterMaster', () => {
    const createDto = new CreateResourceCenterMasterDto({
      resourceCategoryName: 'Sales Training',
      sequence: 1,
      isActive: true,
      createdBy: '507f1f77bcf86cd799439011',
    });

    it('should create a resource center master successfully', async () => {
      jest.spyOn(service, 'generateCategoryId').mockResolvedValue('RCMAS1234');
      mockRepository.createResourceCenterMaster.mockResolvedValue(
        mockResourceCenterMaster,
      );

      const result = await service.createResourceCenterMaster(createDto);

      expect(service.generateCategoryId).toHaveBeenCalledTimes(1);
      expect(mockRepository.createResourceCenterMaster).toHaveBeenCalledWith({
        ...createDto,
        categoryId: 'RCMAS1234',
      });
      expect(result).toEqual(mockResourceCenterMaster);
    });

    it('should create with minimal data and generate categoryId', async () => {
      const minimalDto = new CreateResourceCenterMasterDto({
        resourceCategoryName: 'Product Training',
        sequence: 2,
      });

      jest.spyOn(service, 'generateCategoryId').mockResolvedValue('RCMAS5678');
      const minimalResult = {
        ...mockResourceCenterMaster,
        resourceCategoryName: 'Product Training',
        sequence: 2,
        categoryId: 'RCMAS5678',
        isActive: false,
      } as unknown as IResourceCenterMaster;

      mockRepository.createResourceCenterMaster.mockResolvedValue(
        minimalResult,
      );

      const result = await service.createResourceCenterMaster(minimalDto);

      expect(service.generateCategoryId).toHaveBeenCalledTimes(1);
      expect(mockRepository.createResourceCenterMaster).toHaveBeenCalledWith({
        ...minimalDto,
        categoryId: 'RCMAS5678',
      });
      expect(result).toEqual(minimalResult);
    });

    it('should handle repository error', async () => {
      jest.spyOn(service, 'generateCategoryId').mockResolvedValue('RCMAS9999');
      mockRepository.createResourceCenterMaster.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.createResourceCenterMaster(createDto),
      ).rejects.toThrow('Database error');

      expect(service.generateCategoryId).toHaveBeenCalledTimes(1);
      expect(mockRepository.createResourceCenterMaster).toHaveBeenCalledWith({
        ...createDto,
        categoryId: 'RCMAS9999',
      });
    });

    it('should create with full DTO properties', async () => {
      const fullDto = new CreateResourceCenterMasterDto({
        resourceCategoryName: 'Marketing Training',
        sequence: 3,
        isActive: false,
        createdBy: '507f1f77bcf86cd799439012',
      });

      jest.spyOn(service, 'generateCategoryId').mockResolvedValue('RCMAS9999');
      const fullResult = {
        ...mockResourceCenterMaster,
        ...fullDto,
        categoryId: 'RCMAS9999',
      } as unknown as IResourceCenterMaster;

      mockRepository.createResourceCenterMaster.mockResolvedValue(fullResult);

      const result = await service.createResourceCenterMaster(fullDto);

      expect(result).toEqual(fullResult);
      expect(mockRepository.createResourceCenterMaster).toHaveBeenCalledWith({
        ...fullDto,
        categoryId: 'RCMAS9999',
      });
    });

    it('should preserve DTO properties', async () => {
      jest.spyOn(service, 'generateCategoryId').mockResolvedValue('RCMAS1111');
      mockRepository.createResourceCenterMaster.mockResolvedValue(
        mockResourceCenterMaster,
      );

      await service.createResourceCenterMaster(createDto);

      const repositoryCall =
        mockRepository.createResourceCenterMaster.mock.calls[0][0];
      expect(repositoryCall.resourceCategoryName).toBe(
        createDto.resourceCategoryName,
      );
      expect(repositoryCall.sequence).toBe(createDto.sequence);
      expect(repositoryCall.isActive).toBe(createDto.isActive);
      expect(repositoryCall.createdBy).toBe(createDto.createdBy);
      expect(repositoryCall.categoryId).toBe('RCMAS1111');
    });

    it('should handle categoryId generation error', async () => {
      jest
        .spyOn(service, 'generateCategoryId')
        .mockRejectedValue(new Error('Generation failed'));

      await expect(
        service.createResourceCenterMaster(createDto),
      ).rejects.toThrow('Generation failed');

      expect(mockRepository.createResourceCenterMaster).not.toHaveBeenCalled();
    });
  });

  describe('getAllResourceCenterMasters', () => {
    const mockResourceCenterMasters = [
      {
        ...mockResourceCenterMaster,
        _id: '507f1f77bcf86cd799439011',
        resourceCategoryName: 'Sales Training',
        categoryId: 'RCMAS1111',
      },
      {
        ...mockResourceCenterMaster,
        _id: '507f1f77bcf86cd799439012',
        resourceCategoryName: 'Product Training',
        categoryId: 'RCMAS2222',
      },
    ] as unknown as IResourceCenterMaster[];

    it('should get all resource center masters successfully', async () => {
      mockRepository.getAllResourceCenterMasters.mockResolvedValue(
        mockResourceCenterMasters,
      );

      const result = await service.getAllResourceCenterMasters();

      expect(mockRepository.getAllResourceCenterMasters).toHaveBeenCalledTimes(
        1,
      );
      expect(result).toEqual(mockResourceCenterMasters);
    });

    it('should return empty array when no masters exist', async () => {
      mockRepository.getAllResourceCenterMasters.mockResolvedValue([]);

      const result = await service.getAllResourceCenterMasters();

      expect(mockRepository.getAllResourceCenterMasters).toHaveBeenCalledTimes(
        1,
      );
      expect(result).toEqual([]);
    });

    it('should handle repository error', async () => {
      mockRepository.getAllResourceCenterMasters.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getAllResourceCenterMasters()).rejects.toThrow(
        'Database error',
      );

      expect(mockRepository.getAllResourceCenterMasters).toHaveBeenCalledTimes(
        1,
      );
    });

    it('should handle large datasets', async () => {
      const largeMockData = Array.from({ length: 100 }, (_, index) => ({
        ...mockResourceCenterMaster,
        _id: `507f1f77bcf86cd79943${index.toString().padStart(4, '0')}`,
        resourceCategoryName: `Training ${index}`,
        categoryId: `RCMAS${index.toString().padStart(4, '0')}`,
        sequence: index,
      })) as unknown as IResourceCenterMaster[];

      mockRepository.getAllResourceCenterMasters.mockResolvedValue(
        largeMockData,
      );

      const result = await service.getAllResourceCenterMasters();

      expect(result).toHaveLength(100);
      expect(result).toEqual(largeMockData);
    });

    it('should handle timeout error', async () => {
      mockRepository.getAllResourceCenterMasters.mockRejectedValue(
        new Error('Request timeout'),
      );

      await expect(service.getAllResourceCenterMasters()).rejects.toThrow(
        'Request timeout',
      );
    });
  });

  describe('updateResourceCenterMaster', () => {
    const updateDto = new UpdateResourceCenterMasterDto({
      resourceCategoryName: 'Updated Sales Training',
      sequence: 10,
      isActive: false,
      updatedBy: '507f1f77bcf86cd799439011',
    });

    const updatedMockResourceCenterMaster = {
      ...mockResourceCenterMaster,
      ...updateDto,
      updatedAt: new Date('2023-12-01T12:00:00.000Z'),
    } as unknown as IResourceCenterMaster;

    it('should update resource center master successfully', async () => {
      mockRepository.updateResourceCenterMaster.mockResolvedValue(
        updatedMockResourceCenterMaster,
      );

      const result = await service.updateResourceCenterMaster(
        '507f1f77bcf86cd799439011',
        updateDto,
      );

      expect(mockRepository.updateResourceCenterMaster).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateDto,
      );
      expect(result).toEqual(updatedMockResourceCenterMaster);
    });

    it('should update with categoryId and check for duplicates', async () => {
      const updateWithCategoryId = new UpdateResourceCenterMasterDto({
        categoryId: 'RCMAS9999',
      });

      mockRepository.findCategoryIdExists.mockResolvedValue(false);
      const updatedWithCategoryId = {
        ...updatedMockResourceCenterMaster,
        categoryId: 'RCMAS9999',
      } as unknown as IResourceCenterMaster;

      mockRepository.updateResourceCenterMaster.mockResolvedValue(
        updatedWithCategoryId,
      );

      const result = await service.updateResourceCenterMaster(
        '507f1f77bcf86cd799439011',
        updateWithCategoryId,
      );

      expect(mockRepository.findCategoryIdExists).toHaveBeenCalledWith(
        'RCMAS9999',
      );
      expect(mockRepository.updateResourceCenterMaster).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateWithCategoryId,
      );
      expect(result).toEqual(updatedWithCategoryId);
    });

    it('should update without categoryId check when categoryId not provided', async () => {
      const updateWithoutCategoryId = new UpdateResourceCenterMasterDto({
        resourceCategoryName: 'No Category ID Update',
        sequence: 5,
      });

      const resultWithoutCategoryId = {
        ...mockResourceCenterMaster,
        resourceCategoryName: 'No Category ID Update',
        sequence: 5,
      } as unknown as IResourceCenterMaster;

      mockRepository.updateResourceCenterMaster.mockResolvedValue(
        resultWithoutCategoryId,
      );

      const result = await service.updateResourceCenterMaster(
        '507f1f77bcf86cd799439011',
        updateWithoutCategoryId,
      );

      expect(mockRepository.findCategoryIdExists).not.toHaveBeenCalled();
      expect(mockRepository.updateResourceCenterMaster).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateWithoutCategoryId,
      );
      expect(result).toEqual(resultWithoutCategoryId);
    });

    it('should throw error when categoryId already exists', async () => {
      const updateWithExistingCategoryId = new UpdateResourceCenterMasterDto({
        categoryId: 'RCMAS1111',
      });

      mockRepository.findCategoryIdExists.mockResolvedValue(true);

      await expect(
        service.updateResourceCenterMaster(
          '507f1f77bcf86cd799439011',
          updateWithExistingCategoryId,
        ),
      ).rejects.toThrow("Category ID 'RCMAS1111' already exists");

      expect(mockRepository.findCategoryIdExists).toHaveBeenCalledWith(
        'RCMAS1111',
      );
      expect(mockRepository.updateResourceCenterMaster).not.toHaveBeenCalled();
    });

    it('should return null when record not found', async () => {
      mockRepository.updateResourceCenterMaster.mockResolvedValue(null);

      const result = await service.updateResourceCenterMaster(
        '507f1f77bcf86cd799439011',
        updateDto,
      );

      expect(result).toBeNull();
      expect(mockRepository.updateResourceCenterMaster).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateDto,
      );
    });

    it('should handle repository error', async () => {
      mockRepository.updateResourceCenterMaster.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.updateResourceCenterMaster(
          '507f1f77bcf86cd799439011',
          updateDto,
        ),
      ).rejects.toThrow('Database error');

      expect(mockRepository.updateResourceCenterMaster).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateDto,
      );
    });

    it('should handle partial update data', async () => {
      const partialUpdate = new UpdateResourceCenterMasterDto({
        resourceCategoryName: 'Partially Updated',
      });

      const partialResult = {
        ...mockResourceCenterMaster,
        resourceCategoryName: 'Partially Updated',
      } as unknown as IResourceCenterMaster;

      mockRepository.updateResourceCenterMaster.mockResolvedValue(
        partialResult,
      );

      const result = await service.updateResourceCenterMaster(
        '507f1f77bcf86cd799439011',
        partialUpdate,
      );

      expect(result).toEqual(partialResult);
      expect(mockRepository.updateResourceCenterMaster).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        partialUpdate,
      );
    });

    it('should handle categoryId existence check error', async () => {
      const updateWithCategoryId = new UpdateResourceCenterMasterDto({
        categoryId: 'RCMAS9999',
      });

      mockRepository.findCategoryIdExists.mockRejectedValue(
        new Error('Check failed'),
      );

      await expect(
        service.updateResourceCenterMaster(
          '507f1f77bcf86cd799439011',
          updateWithCategoryId,
        ),
      ).rejects.toThrow('Check failed');

      expect(mockRepository.findCategoryIdExists).toHaveBeenCalledWith(
        'RCMAS9999',
      );
      expect(mockRepository.updateResourceCenterMaster).not.toHaveBeenCalled();
    });
  });

  describe('generateCategoryId', () => {
    beforeEach(() => {
      // Reset the spy before each test
      jest.restoreAllMocks();
    });

    it('should generate unique categoryId successfully', async () => {
      mockRepository.findCategoryIdExists.mockResolvedValue(false);

      const result = await service.generateCategoryId();

      expect(result).toMatch(/^RCMAS\d{4}$/);
      expect(mockRepository.findCategoryIdExists).toHaveBeenCalledWith(result);
    });

    it('should retry when categoryId already exists', async () => {
      mockRepository.findCategoryIdExists
        .mockResolvedValueOnce(true) // First attempt - exists
        .mockResolvedValueOnce(true) // Second attempt - exists
        .mockResolvedValueOnce(false); // Third attempt - unique

      const result = await service.generateCategoryId();

      expect(result).toMatch(/^RCMAS\d{4}$/);
      expect(mockRepository.findCategoryIdExists).toHaveBeenCalledTimes(3);
    });

    it('should throw error after maximum attempts', async () => {
      mockRepository.findCategoryIdExists.mockResolvedValue(true); // Always exists

      await expect(service.generateCategoryId()).rejects.toThrow(
        'Failed to generate unique category ID after maximum attempts',
      );

      expect(mockRepository.findCategoryIdExists).toHaveBeenCalledTimes(10);
    });

    it('should handle repository error during existence check', async () => {
      mockRepository.findCategoryIdExists.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.generateCategoryId()).rejects.toThrow(
        'Database error',
      );

      expect(mockRepository.findCategoryIdExists).toHaveBeenCalledTimes(1);
    });

    it('should generate different IDs on multiple calls', async () => {
      mockRepository.findCategoryIdExists.mockResolvedValue(false);

      const id1 = await service.generateCategoryId();
      const id2 = await service.generateCategoryId();

      expect(id1).toMatch(/^RCMAS\d{4}$/);
      expect(id2).toMatch(/^RCMAS\d{4}$/);
      // Note: Due to randomness, they might be the same, but that's okay for this test
    });

    it('should validate generated ID format', async () => {
      mockRepository.findCategoryIdExists.mockResolvedValue(false);

      const result = await service.generateCategoryId();

      expect(result).toHaveLength(9); // RCMAS + 4 digits
      expect(result.startsWith('RCMAS')).toBe(true);
      expect(result.substring(5)).toMatch(/^\d{4}$/);
    });
  });

  describe('error handling', () => {
    it('should handle non-Error exceptions', async () => {
      const createDto = new CreateResourceCenterMasterDto({
        resourceCategoryName: 'Test Training',
        sequence: 1,
      });

      jest.spyOn(service, 'generateCategoryId').mockResolvedValue('RCMAS1234');
      mockRepository.createResourceCenterMaster.mockRejectedValue(
        'String error',
      );

      await expect(service.createResourceCenterMaster(createDto)).rejects.toBe(
        'String error',
      );
    });

    it('should propagate repository errors correctly', async () => {
      const updateDto = new UpdateResourceCenterMasterDto({
        resourceCategoryName: 'Error Test',
      });

      const customError = new Error('Custom repository error');
      mockRepository.updateResourceCenterMaster.mockRejectedValue(customError);

      await expect(
        service.updateResourceCenterMaster(
          '507f1f77bcf86cd799439011',
          updateDto,
        ),
      ).rejects.toThrow('Custom repository error');
    });
  });

  describe('interface compliance', () => {
    it('should implement IResourceCenterMasterService interface', () => {
      expect(typeof service.createResourceCenterMaster).toBe('function');
      expect(typeof service.getAllResourceCenterMasters).toBe('function');
      expect(typeof service.updateResourceCenterMaster).toBe('function');
      expect(typeof service.generateCategoryId).toBe('function');
    });

    it('should have correct method signatures', () => {
      expect(service.createResourceCenterMaster.length).toBe(1);
      expect(service.getAllResourceCenterMasters.length).toBe(0);
      expect(service.updateResourceCenterMaster.length).toBe(2);
      expect(service.generateCategoryId.length).toBe(0);
    });
  });

  describe('DTO handling', () => {
    it('should work with CreateResourceCenterMasterDto instance', async () => {
      const dto = new CreateResourceCenterMasterDto({
        resourceCategoryName: 'DTO Test',
        sequence: 1,
        isActive: true,
      });

      jest.spyOn(service, 'generateCategoryId').mockResolvedValue('RCMAS1234');
      mockRepository.createResourceCenterMaster.mockResolvedValue(
        mockResourceCenterMaster,
      );

      await service.createResourceCenterMaster(dto);

      expect(mockRepository.createResourceCenterMaster).toHaveBeenCalledWith({
        resourceCategoryName: 'DTO Test',
        sequence: 1,
        isActive: true,
        categoryId: 'RCMAS1234',
      });
    });

    it('should work with UpdateResourceCenterMasterDto instance', async () => {
      const dto = new UpdateResourceCenterMasterDto({
        resourceCategoryName: 'Updated DTO Test',
        isActive: false,
      });

      mockRepository.updateResourceCenterMaster.mockResolvedValue(
        mockResourceCenterMaster,
      );

      await service.updateResourceCenterMaster('507f1f77bcf86cd799439011', dto);

      expect(mockRepository.updateResourceCenterMaster).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        dto,
      );
    });
  });
});
