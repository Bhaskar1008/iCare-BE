import { ResourceCenterMasterController } from '../resource-center-master.controller';
import { ResourceCenterMasterService } from '../resource-center-master.service';
import { CreateResourceCenterMasterDto } from '../dto/create-resource-center-master.dto';
import { UpdateResourceCenterMasterDto } from '../dto/update-resource-center-master.dto';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import type { Request, Response } from 'express';
import type { IResourceCenterMaster } from '@/models/resource-center-master.model';

// Mock the logger
jest.mock('@/common/utils/logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

// Mock the service
jest.mock('../resource-center-master.service');

// Create a test controller class that exposes protected methods
class TestResourceCenterMasterController extends ResourceCenterMasterController {
  public testSendCreated = jest.fn();
  public testSendSuccess = jest.fn();
  public testSendUpdated = jest.fn();
  public testSendNotFound = jest.fn();
  public testSendError = jest.fn();

  protected sendCreated(res: any, data: any, message: string): void {
    this.testSendCreated(res, data, message);
  }

  protected sendSuccess(res: any, data: any, message: string): void {
    this.testSendSuccess(res, data, message);
  }

  protected sendUpdated(res: any, data: any, message: string): void {
    this.testSendUpdated(res, data, message);
  }

  protected sendNotFound(res: any, message: string): void {
    this.testSendNotFound(res, message);
  }

  protected sendError(
    res: any,
    message: string,
    statusCode: number,
    error: any,
  ): void {
    this.testSendError(res, message, statusCode, error);
  }
}

describe('ResourceCenterMasterController', () => {
  let controller: TestResourceCenterMasterController;
  let mockService: jest.Mocked<ResourceCenterMasterService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

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

    // Create mock service instance
    mockService = {
      createResourceCenterMaster: jest.fn(),
      getAllResourceCenterMasters: jest.fn(),
      updateResourceCenterMaster: jest.fn(),
      generateCategoryId: jest.fn(),
    } as any;

    // Mock the service constructor
    (
      ResourceCenterMasterService as jest.MockedClass<
        typeof ResourceCenterMasterService
      >
    ).mockImplementation(() => mockService);

    controller = new TestResourceCenterMasterController();

    // Setup mock request and response
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    // Clear the mock functions
    controller.testSendCreated.mockClear();
    controller.testSendSuccess.mockClear();
    controller.testSendUpdated.mockClear();
    controller.testSendNotFound.mockClear();
    controller.testSendError.mockClear();
  });

  describe('createResourceCenterMaster', () => {
    const createData = {
      resourceCategoryName: 'Sales Training',
      sequence: 1,
      isActive: true,
      createdBy: '507f1f77bcf86cd799439011',
    };

    it('should create a resource center master successfully', async () => {
      mockRequest.body = createData;
      mockService.createResourceCenterMaster.mockResolvedValue(
        mockResourceCenterMaster,
      );

      await controller.createResourceCenterMaster(
        mockRequest as Request<
          unknown,
          unknown,
          Partial<CreateResourceCenterMasterDto>
        >,
        mockResponse as Response,
      );

      expect(mockService.createResourceCenterMaster).toHaveBeenCalledWith(
        expect.objectContaining(createData),
      );
      expect(controller.testSendCreated).toHaveBeenCalledWith(
        mockResponse,
        mockResourceCenterMaster,
        'Resource center master created successfully',
      );
    });

    it('should create a resource center master with minimal data', async () => {
      const minimalData = {
        resourceCategoryName: 'Product Training',
        sequence: 2,
      };

      mockRequest.body = minimalData;
      const minimalResult = {
        ...mockResourceCenterMaster,
        resourceCategoryName: 'Product Training',
        sequence: 2,
        isActive: false,
      } as unknown as IResourceCenterMaster;

      mockService.createResourceCenterMaster.mockResolvedValue(minimalResult);

      await controller.createResourceCenterMaster(
        mockRequest as Request<
          unknown,
          unknown,
          Partial<CreateResourceCenterMasterDto>
        >,
        mockResponse as Response,
      );

      expect(mockService.createResourceCenterMaster).toHaveBeenCalledWith(
        expect.objectContaining(minimalData),
      );
      expect(controller.testSendCreated).toHaveBeenCalled();
    });

    it('should handle service error', async () => {
      mockRequest.body = createData;
      const serviceError = new Error('Database connection failed');
      mockService.createResourceCenterMaster.mockRejectedValue(serviceError);

      await controller.createResourceCenterMaster(
        mockRequest as Request<
          unknown,
          unknown,
          Partial<CreateResourceCenterMasterDto>
        >,
        mockResponse as Response,
      );

      expect(mockService.createResourceCenterMaster).toHaveBeenCalled();
      expect(controller.testSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to create resource center master.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        serviceError,
      );
    });

    it('should handle duplicate category ID error with conflict status', async () => {
      mockRequest.body = createData;
      const duplicateError = new Error(
        "Category ID 'RCMAS1234' already exists",
      );
      mockService.createResourceCenterMaster.mockRejectedValue(duplicateError);

      await controller.createResourceCenterMaster(
        mockRequest as Request<
          unknown,
          unknown,
          Partial<CreateResourceCenterMasterDto>
        >,
        mockResponse as Response,
      );

      expect(controller.testSendError).toHaveBeenCalledWith(
        mockResponse,
        duplicateError.message,
        HTTP_STATUS.CONFLICT,
        duplicateError,
      );
    });

    it('should handle validation error', async () => {
      mockRequest.body = { sequence: 1 }; // Missing required resourceCategoryName
      const validationError = new Error('Resource category name is required');
      mockService.createResourceCenterMaster.mockRejectedValue(validationError);

      await controller.createResourceCenterMaster(
        mockRequest as Request<
          unknown,
          unknown,
          Partial<CreateResourceCenterMasterDto>
        >,
        mockResponse as Response,
      );

      expect(controller.testSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to create resource center master.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        validationError,
      );
    });

    it('should create DTO from request body', async () => {
      const fullData = {
        resourceCategoryName: 'Marketing Training',
        sequence: 3,
        isActive: false,
        createdBy: '507f1f77bcf86cd799439012',
      };

      mockRequest.body = fullData;
      mockService.createResourceCenterMaster.mockResolvedValue(
        mockResourceCenterMaster,
      );

      await controller.createResourceCenterMaster(
        mockRequest as Request<
          unknown,
          unknown,
          Partial<CreateResourceCenterMasterDto>
        >,
        mockResponse as Response,
      );

      expect(mockService.createResourceCenterMaster).toHaveBeenCalledWith(
        expect.any(CreateResourceCenterMasterDto),
      );
    });

    it('should handle empty request body', async () => {
      mockRequest.body = {};
      const emptyBodyError = new Error('Resource category name is required');
      mockService.createResourceCenterMaster.mockRejectedValue(emptyBodyError);

      await controller.createResourceCenterMaster(
        mockRequest as Request<
          unknown,
          unknown,
          Partial<CreateResourceCenterMasterDto>
        >,
        mockResponse as Response,
      );

      expect(controller.testSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to create resource center master.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        emptyBodyError,
      );
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
      mockService.getAllResourceCenterMasters.mockResolvedValue(
        mockResourceCenterMasters,
      );

      await controller.getAllResourceCenterMasters(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockService.getAllResourceCenterMasters).toHaveBeenCalledTimes(1);
      expect(controller.testSendSuccess).toHaveBeenCalledWith(
        mockResponse,
        mockResourceCenterMasters,
        'Successfully fetched all resource center masters.',
      );
    });

    it('should return empty array when no masters exist', async () => {
      mockService.getAllResourceCenterMasters.mockResolvedValue([]);

      await controller.getAllResourceCenterMasters(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockService.getAllResourceCenterMasters).toHaveBeenCalledTimes(1);
      expect(controller.testSendSuccess).toHaveBeenCalledWith(
        mockResponse,
        [],
        'Successfully fetched all resource center masters.',
      );
    });

    it('should handle service error', async () => {
      const serviceError = new Error('Database connection failed');
      mockService.getAllResourceCenterMasters.mockRejectedValue(serviceError);

      await controller.getAllResourceCenterMasters(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(controller.testSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to fetch resource center masters.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        serviceError,
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

      mockService.getAllResourceCenterMasters.mockResolvedValue(largeMockData);

      await controller.getAllResourceCenterMasters(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(controller.testSendSuccess).toHaveBeenCalledWith(
        mockResponse,
        largeMockData,
        'Successfully fetched all resource center masters.',
      );
    });

    it('should handle timeout error', async () => {
      const timeoutError = new Error('Request timeout');
      mockService.getAllResourceCenterMasters.mockRejectedValue(timeoutError);

      await controller.getAllResourceCenterMasters(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(controller.testSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to fetch resource center masters.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        timeoutError,
      );
    });
  });

  describe('updateResourceCenterMaster', () => {
    const updateData = {
      resourceCategoryName: 'Updated Sales Training',
      sequence: 10,
      isActive: false,
      updatedBy: '507f1f77bcf86cd799439011',
    };

    const updatedMockResourceCenterMaster = {
      ...mockResourceCenterMaster,
      ...updateData,
      updatedAt: new Date('2023-12-01T12:00:00.000Z'),
    } as unknown as IResourceCenterMaster;

    beforeEach(() => {
      mockRequest.params = { id: '507f1f77bcf86cd799439011' };
      mockRequest.body = updateData;
    });

    it('should update resource center master successfully', async () => {
      mockService.updateResourceCenterMaster.mockResolvedValue(
        updatedMockResourceCenterMaster,
      );

      await controller.updateResourceCenterMaster(
        mockRequest as Request<
          { id: string },
          unknown,
          Partial<UpdateResourceCenterMasterDto>
        >,
        mockResponse as Response,
      );

      expect(mockService.updateResourceCenterMaster).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining(updateData),
      );
      expect(controller.testSendUpdated).toHaveBeenCalledWith(
        mockResponse,
        updatedMockResourceCenterMaster,
        'Resource center master updated successfully',
      );
    });

    it('should update with partial data', async () => {
      const partialUpdateData = {
        resourceCategoryName: 'Partially Updated Training',
      };

      mockRequest.body = partialUpdateData;
      const partialUpdatedMaster = {
        ...mockResourceCenterMaster,
        resourceCategoryName: 'Partially Updated Training',
        updatedAt: new Date('2023-12-01T12:00:00.000Z'),
      } as unknown as IResourceCenterMaster;

      mockService.updateResourceCenterMaster.mockResolvedValue(
        partialUpdatedMaster,
      );

      await controller.updateResourceCenterMaster(
        mockRequest as Request<
          { id: string },
          unknown,
          Partial<UpdateResourceCenterMasterDto>
        >,
        mockResponse as Response,
      );

      expect(mockService.updateResourceCenterMaster).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining(partialUpdateData),
      );
      expect(controller.testSendUpdated).toHaveBeenCalledWith(
        mockResponse,
        partialUpdatedMaster,
        'Resource center master updated successfully',
      );
    });

    it('should return not found when resource center master does not exist', async () => {
      mockService.updateResourceCenterMaster.mockResolvedValue(null);

      await controller.updateResourceCenterMaster(
        mockRequest as Request<
          { id: string },
          unknown,
          Partial<UpdateResourceCenterMasterDto>
        >,
        mockResponse as Response,
      );

      expect(mockService.updateResourceCenterMaster).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.any(UpdateResourceCenterMasterDto),
      );
      expect(controller.testSendNotFound).toHaveBeenCalledWith(
        mockResponse,
        'Resource center master not found',
      );
    });

    it('should handle service error', async () => {
      const serviceError = new Error('Database update failed');
      mockService.updateResourceCenterMaster.mockRejectedValue(serviceError);

      await controller.updateResourceCenterMaster(
        mockRequest as Request<
          { id: string },
          unknown,
          Partial<UpdateResourceCenterMasterDto>
        >,
        mockResponse as Response,
      );

      expect(controller.testSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to update resource center master.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        serviceError,
      );
    });

    it('should handle duplicate category ID error with conflict status', async () => {
      const duplicateError = new Error(
        "Category ID 'RCMAS9999' already exists",
      );
      mockService.updateResourceCenterMaster.mockRejectedValue(duplicateError);

      await controller.updateResourceCenterMaster(
        mockRequest as Request<
          { id: string },
          unknown,
          Partial<UpdateResourceCenterMasterDto>
        >,
        mockResponse as Response,
      );

      expect(controller.testSendError).toHaveBeenCalledWith(
        mockResponse,
        duplicateError.message,
        HTTP_STATUS.CONFLICT,
        duplicateError,
      );
    });

    it('should handle validation error', async () => {
      const validationError = new Error('Sequence must be a positive number');
      mockService.updateResourceCenterMaster.mockRejectedValue(validationError);

      await controller.updateResourceCenterMaster(
        mockRequest as Request<
          { id: string },
          unknown,
          Partial<UpdateResourceCenterMasterDto>
        >,
        mockResponse as Response,
      );

      expect(controller.testSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to update resource center master.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        validationError,
      );
    });

    it('should create DTO from request body', async () => {
      const fullUpdateData = {
        resourceCategoryName: 'Marketing Training',
        sequence: 15,
        isActive: true,
        categoryId: 'RCMAS9999',
        updatedBy: '507f1f77bcf86cd799439012',
      };

      mockRequest.body = fullUpdateData;
      const fullUpdatedMaster = {
        ...mockResourceCenterMaster,
        ...fullUpdateData,
        updatedAt: new Date('2023-12-01T12:00:00.000Z'),
      } as unknown as IResourceCenterMaster;
      mockService.updateResourceCenterMaster.mockResolvedValue(
        fullUpdatedMaster,
      );

      await controller.updateResourceCenterMaster(
        mockRequest as Request<
          { id: string },
          unknown,
          Partial<UpdateResourceCenterMasterDto>
        >,
        mockResponse as Response,
      );

      expect(mockService.updateResourceCenterMaster).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.any(UpdateResourceCenterMasterDto),
      );
    });

    it('should handle empty request body', async () => {
      mockRequest.body = {};
      const emptyUpdatedMaster = {
        ...mockResourceCenterMaster,
        updatedAt: new Date('2023-12-01T12:00:00.000Z'),
      } as unknown as IResourceCenterMaster;
      mockService.updateResourceCenterMaster.mockResolvedValue(
        emptyUpdatedMaster,
      );

      await controller.updateResourceCenterMaster(
        mockRequest as Request<
          { id: string },
          unknown,
          Partial<UpdateResourceCenterMasterDto>
        >,
        mockResponse as Response,
      );

      expect(mockService.updateResourceCenterMaster).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.any(UpdateResourceCenterMasterDto),
      );
    });

    it('should handle invalid ObjectId in params', async () => {
      mockRequest.params = { id: 'invalid-id' };
      const invalidIdError = new Error('Invalid ObjectId');
      mockService.updateResourceCenterMaster.mockRejectedValue(invalidIdError);

      await controller.updateResourceCenterMaster(
        mockRequest as Request<
          { id: string },
          unknown,
          Partial<UpdateResourceCenterMasterDto>
        >,
        mockResponse as Response,
      );

      expect(controller.testSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to update resource center master.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        invalidIdError,
      );
    });

    it('should handle categoryId update with existing ID', async () => {
      const updateWithCategoryId = {
        categoryId: 'RCMAS1111',
      };

      mockRequest.body = updateWithCategoryId;
      const existingCategoryError = new Error(
        "Category ID 'RCMAS1111' already exists",
      );
      mockService.updateResourceCenterMaster.mockRejectedValue(
        existingCategoryError,
      );

      await controller.updateResourceCenterMaster(
        mockRequest as Request<
          { id: string },
          unknown,
          Partial<UpdateResourceCenterMasterDto>
        >,
        mockResponse as Response,
      );

      expect(controller.testSendError).toHaveBeenCalledWith(
        mockResponse,
        existingCategoryError.message,
        HTTP_STATUS.CONFLICT,
        existingCategoryError,
      );
    });
  });

  describe('error handling edge cases', () => {
    it('should handle non-Error exceptions in createResourceCenterMaster', async () => {
      mockRequest.body = { resourceCategoryName: 'Test', sequence: 1 };
      mockService.createResourceCenterMaster.mockRejectedValue('String error');

      await controller.createResourceCenterMaster(
        mockRequest as Request<
          unknown,
          unknown,
          Partial<CreateResourceCenterMasterDto>
        >,
        mockResponse as Response,
      );

      expect(controller.testSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to create resource center master.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        { message: 'String error' },
      );
    });

    it('should handle non-Error exceptions in getAllResourceCenterMasters', async () => {
      mockService.getAllResourceCenterMasters.mockRejectedValue('String error');

      await controller.getAllResourceCenterMasters(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(controller.testSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to fetch resource center masters.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        { message: 'String error' },
      );
    });

    it('should handle non-Error exceptions in updateResourceCenterMaster', async () => {
      mockRequest.params = { id: '507f1f77bcf86cd799439011' };
      mockRequest.body = { resourceCategoryName: 'Test' };
      mockService.updateResourceCenterMaster.mockRejectedValue('String error');

      await controller.updateResourceCenterMaster(
        mockRequest as Request<
          { id: string },
          unknown,
          Partial<UpdateResourceCenterMasterDto>
        >,
        mockResponse as Response,
      );

      expect(controller.testSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to update resource center master.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        { message: 'String error' },
      );
    });
  });

  describe('inheritance from BaseController', () => {
    it('should extend BaseController', () => {
      expect(controller).toBeInstanceOf(ResourceCenterMasterController);
      // BaseController methods should be available through test class
      expect(typeof controller.testSendCreated).toBe('function');
      expect(typeof controller.testSendSuccess).toBe('function');
      expect(typeof controller.testSendUpdated).toBe('function');
      expect(typeof controller.testSendNotFound).toBe('function');
      expect(typeof controller.testSendError).toBe('function');
    });
  });

  describe('interface compliance', () => {
    it('should implement IResourceCenterMasterController interface', () => {
      expect(typeof controller.createResourceCenterMaster).toBe('function');
      expect(typeof controller.getAllResourceCenterMasters).toBe('function');
      expect(typeof controller.updateResourceCenterMaster).toBe('function');
    });

    it('should have correct method signatures', () => {
      // Check that methods accept correct parameter types
      expect(controller.createResourceCenterMaster.length).toBe(2); // req, res
      expect(controller.getAllResourceCenterMasters.length).toBe(2); // req, res
      expect(controller.updateResourceCenterMaster.length).toBe(2); // req, res
    });
  });

  describe('DTO instantiation', () => {
    it('should properly instantiate CreateResourceCenterMasterDto', async () => {
      const createData = {
        resourceCategoryName: 'Test Training',
        sequence: 1,
        isActive: true,
        createdBy: '507f1f77bcf86cd799439011',
      };

      mockRequest.body = createData;
      mockService.createResourceCenterMaster.mockResolvedValue(
        mockResourceCenterMaster,
      );

      await controller.createResourceCenterMaster(
        mockRequest as Request<
          unknown,
          unknown,
          Partial<CreateResourceCenterMasterDto>
        >,
        mockResponse as Response,
      );

      // Verify that CreateResourceCenterMasterDto was instantiated correctly
      const createDtoCall =
        mockService.createResourceCenterMaster.mock.calls[0][0];
      expect(createDtoCall).toBeInstanceOf(CreateResourceCenterMasterDto);
      expect(createDtoCall.resourceCategoryName).toBe(
        createData.resourceCategoryName,
      );
      expect(createDtoCall.sequence).toBe(createData.sequence);
      expect(createDtoCall.isActive).toBe(createData.isActive);
      expect(createDtoCall.createdBy).toBe(createData.createdBy);
    });

    it('should properly instantiate UpdateResourceCenterMasterDto', async () => {
      const updateData = {
        resourceCategoryName: 'Updated Test Training',
        sequence: 10,
        isActive: false,
        updatedBy: '507f1f77bcf86cd799439011',
      };

      mockRequest.params = { id: '507f1f77bcf86cd799439011' };
      mockRequest.body = updateData;
      const testUpdatedMaster = {
        ...mockResourceCenterMaster,
        ...updateData,
        updatedAt: new Date('2023-12-01T12:00:00.000Z'),
      } as unknown as IResourceCenterMaster;
      mockService.updateResourceCenterMaster.mockResolvedValue(
        testUpdatedMaster,
      );

      await controller.updateResourceCenterMaster(
        mockRequest as Request<
          { id: string },
          unknown,
          Partial<UpdateResourceCenterMasterDto>
        >,
        mockResponse as Response,
      );

      // Verify that UpdateResourceCenterMasterDto was instantiated correctly
      const updateDtoCall =
        mockService.updateResourceCenterMaster.mock.calls[0][1];
      expect(updateDtoCall).toBeInstanceOf(UpdateResourceCenterMasterDto);
      expect(updateDtoCall.resourceCategoryName).toBe(
        updateData.resourceCategoryName,
      );
      expect(updateDtoCall.sequence).toBe(updateData.sequence);
      expect(updateDtoCall.isActive).toBe(updateData.isActive);
      expect(updateDtoCall.updatedBy).toBe(updateData.updatedBy);
    });
  });
});
