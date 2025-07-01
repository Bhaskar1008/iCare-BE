import { ResourceCenterController } from '../resource-center.controller';
import { ResourceCenterService } from '../resource-center.service';
import type { Request, Response } from 'express';
import type { CreateTagDto } from '../dto/create-tag.dto';
import type { CreateResourceCenterDto } from '../dto/create-resource-center.dto';
import type { UpdateResourceCenterDto } from '../dto/update-resource-center.dto';
import type { CreateResourceCenterDocumentDto } from '../dto/create-resource-center-document.dto';
import type { UpdateResourceCenterDocumentDto } from '../dto/update-resource-center-document.dto';
import { DuplicateResourceException } from '@/common/exceptions/duplicate-resource.exception';

// Mock the ResourceCenterService
jest.mock('../resource-center.service');

describe('ResourceCenterController', () => {
  let resourceCenterController: ResourceCenterController;
  let mockResourceCenterService: jest.Mocked<ResourceCenterService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockSendCreated: jest.Mock;
  let mockSendUpdated: jest.Mock;
  let mockSendSuccess: jest.Mock;
  let mockSendError: jest.Mock;
  let mockSendBadRequest: jest.Mock;
  let mockSendNotFound: jest.Mock;

  // Dummy data for testing
  const dummyTag = {
    _id: '507f1f77bcf86cd799439011',
    tagName: 'Sales Training',
    updatedBy: '507f1f77bcf86cd799439012',
    createdBy: '507f1f77bcf86cd799439012',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const dummyCreateTagDto: CreateTagDto = {
    tagName: 'Sales Training',
    updatedBy: '507f1f77bcf86cd799439012',
    createdBy: '507f1f77bcf86cd799439012',
  };

  const dummyResourceCenter = {
    _id: '507f1f77bcf86cd799439013',
    channelId: [
      {
        channelId: '507f1f77bcf86cd799439014',
        channelName: 'Partner Sales',
        _id: '507f1f77bcf86cd799439015',
      },
    ],
    projectId: '507f1f77bcf86cd799439016',
    resourceCategory: '507f1f77bcf86cd799439017',
    subCategory: ['VIDEOS', 'PDF'],
    isActive: true,
    title: 'Sales Training Guide',
    description: 'Comprehensive guide for sales training',
    documentId: '6e4e91ce-f322-41e4-9a0e-9ca3c6f73254',
    publish: 'publish' as const,
    tags: [
      {
        tagName: 'Demo',
        tagId: '507f1f77bcf86cd799439018',
        _id: '507f1f77bcf86cd799439019',
      },
    ],
    roles: [
      {
        roleId: '507f1f77bcf86cd799439020',
        roleName: 'Channel Head',
        _id: '507f1f77bcf86cd799439021',
      },
    ],
    files: [
      {
        s3Key: 'some-s3-key',
        s3Link: 'https://bucket.s3.amazonaws.com/some-s3-key',
        documentFormat: 'pdf',
        isActive: true,
        _id: '507f1f77bcf86cd799439022',
      },
    ],
    createdBy: '507f1f77bcf86cd799439012',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const dummyCreateResourceCenterDto: CreateResourceCenterDto = {
    channelId: [
      {
        channelId: '507f1f77bcf86cd799439014',
        channelName: 'Partner Sales',
      },
    ],
    projectId: '507f1f77bcf86cd799439016',
    resourceCategory: '507f1f77bcf86cd799439017',
    subCategory: ['VIDEOS', 'PDF'],
    isActive: true,
    title: 'Sales Training Guide',
    description: 'Comprehensive guide for sales training',
    documentId: '6e4e91ce-f322-41e4-9a0e-9ca3c6f73254',
    publish: 'publish',
    tags: [
      {
        tagName: 'Demo',
        tagId: '507f1f77bcf86cd799439018',
      },
    ],
    roles: [
      {
        roleId: '507f1f77bcf86cd799439020',
        roleName: 'Channel Head',
      },
    ],
    files: [
      {
        s3Key: 'some-s3-key',
        s3Link: 'https://bucket.s3.amazonaws.com/some-s3-key',
        documentFormat: 'pdf',
        isActive: true,
      },
    ],
    updatedBy: '507f1f77bcf86cd799439012',
    createdBy: '507f1f77bcf86cd799439012',
  };

  const dummyUpdateResourceCenterDto: UpdateResourceCenterDto = {
    title: 'Updated Sales Training Guide',
    description: 'Updated comprehensive guide for sales training',
    isActive: false,
    updatedBy: '507f1f77bcf86cd799439012',
    files: [
      {
        s3Key: 'updated-s3-key',
        s3Link: 'https://bucket.s3.amazonaws.com/updated-s3-key',
        documentFormat: 'pdf',
        isActive: false,
      },
    ],
  };

  const dummyResourceCenterDocument = {
    _id: '507f1f77bcf86cd799439023',
    documentId: '6e4e91ce-f322-41e4-9a0e-9ca3c6f73254',
    s3Key: 'ba9c5956-ab2c-46a0-8656-e86b4d0edb41.pdf',
    s3Link:
      'https://salesverse-inxt-public-documents-20250531.s3.ap-southeast-1.amazonaws.com/ba9c5956-ab2c-46a0-8656-e86b4d0edb41.pdf',
    documentType: ['PDF'],
    documentFormat: 'pdf',
    createdBy: '507f1f77bcf86cd799439012',
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: '507f1f77bcf86cd799439012',
  };

  const dummyCreateResourceCenterDocumentDto: CreateResourceCenterDocumentDto =
    {
      resourceCenterId: '507f1f77bcf86cd799439013',
      documentId: '6e4e91ce-f322-41e4-9a0e-9ca3c6f73254',
      documentType: ['PDF'],
      documentFormat: 'pdf',
      updatedBy: '507f1f77bcf86cd799439012',
      createdBy: '507f1f77bcf86cd799439012',
    };

  const dummyUpdateResourceCenterDocumentDto: UpdateResourceCenterDocumentDto =
    {
      documentType: ['PDF'],
      documentFormat: 'pdf',
      updatedBy: '507f1f77bcf86cd799439012',
    };

  const dummyFile = {
    originalname: 'test-document.pdf',
    mimetype: 'application/pdf',
    buffer: Buffer.from('test file content'),
    size: 1024,
  } as Express.Multer.File;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock response methods
    mockSendCreated = jest.fn();
    mockSendUpdated = jest.fn();
    mockSendSuccess = jest.fn();
    mockSendError = jest.fn();
    mockSendBadRequest = jest.fn();
    mockSendNotFound = jest.fn();

    // Create mock response object
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Create mock request object
    mockRequest = {
      body: {},
      query: {},
      headers: {},
      params: {},
      file: undefined,
      files: undefined,
    };

    // Create ResourceCenterService mock
    mockResourceCenterService =
      new ResourceCenterService() as jest.Mocked<ResourceCenterService>;

    // Create ResourceCenterController instance
    resourceCenterController = new ResourceCenterController();

    // Mock the service methods
    (resourceCenterController as any).resourceCenterService =
      mockResourceCenterService;

    // Mock the base controller methods
    (resourceCenterController as any).sendCreated = mockSendCreated;
    (resourceCenterController as any).sendUpdated = mockSendUpdated;
    (resourceCenterController as any).sendSuccess = mockSendSuccess;
    (resourceCenterController as any).sendError = mockSendError;
    (resourceCenterController as any).sendBadRequest = mockSendBadRequest;
    (resourceCenterController as any).sendNotFound = mockSendNotFound;
  });

  describe('createTag', () => {
    it('should create a tag successfully', async () => {
      // Arrange
      mockRequest.body = dummyCreateTagDto;
      mockResourceCenterService.createTag = jest
        .fn()
        .mockResolvedValue(dummyTag);

      // Act
      await resourceCenterController.createTag(
        mockRequest as Request<unknown, unknown, CreateTagDto>,
        mockResponse as Response,
      );

      // Assert
      expect(mockResourceCenterService.createTag).toHaveBeenCalledWith(
        dummyCreateTagDto,
      );
      expect(mockSendCreated).toHaveBeenCalledWith(
        mockResponse,
        dummyTag,
        'Tag created successfully',
      );
    });

    it('should handle duplicate tag error', async () => {
      // Arrange
      mockRequest.body = dummyCreateTagDto;
      const error = new DuplicateResourceException(
        "Tag with name 'Sales Training' already exists",
      );
      mockResourceCenterService.createTag = jest.fn().mockRejectedValue(error);

      // Act
      await resourceCenterController.createTag(
        mockRequest as Request<unknown, unknown, CreateTagDto>,
        mockResponse as Response,
      );

      // Assert
      expect(mockResourceCenterService.createTag).toHaveBeenCalledWith(
        dummyCreateTagDto,
      );
      expect(mockSendError).toHaveBeenCalledWith(
        mockResponse,
        "Tag with name 'Sales Training' already exists",
        409,
        error,
      );
    });

    it('should handle general error when creating tag fails', async () => {
      // Arrange
      mockRequest.body = dummyCreateTagDto;
      const error = new Error('Database connection failed');
      mockResourceCenterService.createTag = jest.fn().mockRejectedValue(error);

      // Act
      await resourceCenterController.createTag(
        mockRequest as Request<unknown, unknown, CreateTagDto>,
        mockResponse as Response,
      );

      // Assert
      expect(mockResourceCenterService.createTag).toHaveBeenCalledWith(
        dummyCreateTagDto,
      );
      expect(mockSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to create tag.',
        500,
        error,
      );
    });
  });

  describe('getAllTags', () => {
    it('should get all tags successfully', async () => {
      // Arrange
      const tags = [dummyTag];
      mockResourceCenterService.getAllTags = jest.fn().mockResolvedValue(tags);

      // Act
      await resourceCenterController.getAllTags(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(mockResourceCenterService.getAllTags).toHaveBeenCalled();
      expect(mockSendSuccess).toHaveBeenCalledWith(
        mockResponse,
        tags,
        'Successfully fetched all tags.',
      );
    });

    it('should handle error when getting all tags fails', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockResourceCenterService.getAllTags = jest.fn().mockRejectedValue(error);

      // Act
      await resourceCenterController.getAllTags(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(mockResourceCenterService.getAllTags).toHaveBeenCalled();
      expect(mockSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to fetch tags.',
        500,
        error,
      );
    });
  });

  describe('getTagById', () => {
    it('should get tag by ID successfully', async () => {
      // Arrange
      mockRequest.params = { id: '507f1f77bcf86cd799439011' };
      mockResourceCenterService.getTagById = jest
        .fn()
        .mockResolvedValue(dummyTag);

      // Act
      await resourceCenterController.getTagById(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(mockResourceCenterService.getTagById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(mockSendSuccess).toHaveBeenCalledWith(
        mockResponse,
        dummyTag,
        'Successfully fetched tag.',
      );
    });

    it('should return not found when tag does not exist', async () => {
      // Arrange
      mockRequest.params = { id: '507f1f77bcf86cd799439011' };
      mockResourceCenterService.getTagById = jest.fn().mockResolvedValue(null);

      // Act
      await resourceCenterController.getTagById(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(mockResourceCenterService.getTagById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(mockSendNotFound).toHaveBeenCalledWith(
        mockResponse,
        'Tag not found',
      );
    });

    it('should handle error when getting tag by ID fails', async () => {
      // Arrange
      mockRequest.params = { id: '507f1f77bcf86cd799439011' };
      const error = new Error('Database connection failed');
      mockResourceCenterService.getTagById = jest.fn().mockRejectedValue(error);

      // Act
      await resourceCenterController.getTagById(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(mockResourceCenterService.getTagById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(mockSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to fetch tag.',
        500,
        error,
      );
    });
  });

  describe('createResourceCenter', () => {
    it('should create a resource center successfully', async () => {
      // Arrange
      const currentUser = {
        id: '507f1f77bcf86cd799439012',
        projectId: '507f1f77bcf86cd799439016',
      };
      mockRequest.body = dummyCreateResourceCenterDto;
      mockRequest.headers = {
        currentuser: JSON.stringify(currentUser),
      };
      mockResourceCenterService.createResourceCenter = jest
        .fn()
        .mockResolvedValue(dummyResourceCenter);

      // Act
      await resourceCenterController.createResourceCenter(
        mockRequest as Request<unknown, unknown, CreateResourceCenterDto>,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.createResourceCenter,
      ).toHaveBeenCalledWith({
        ...dummyCreateResourceCenterDto,
        projectId: '507f1f77bcf86cd799439016',
      });
      expect(mockSendCreated).toHaveBeenCalledWith(
        mockResponse,
        dummyResourceCenter,
        'Resource center created successfully',
      );
    });

    it('should create a resource center without projectId when not provided in header', async () => {
      // Arrange
      mockRequest.body = dummyCreateResourceCenterDto;
      mockRequest.headers = {};
      mockResourceCenterService.createResourceCenter = jest
        .fn()
        .mockResolvedValue(dummyResourceCenter);

      // Act
      await resourceCenterController.createResourceCenter(
        mockRequest as Request<unknown, unknown, CreateResourceCenterDto>,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.createResourceCenter,
      ).toHaveBeenCalledWith(dummyCreateResourceCenterDto);
      expect(mockSendCreated).toHaveBeenCalledWith(
        mockResponse,
        dummyResourceCenter,
        'Resource center created successfully',
      );
    });

    it('should handle error when creating resource center fails', async () => {
      // Arrange
      mockRequest.body = dummyCreateResourceCenterDto;
      mockRequest.headers = {};
      const error = new Error('Database connection failed');
      mockResourceCenterService.createResourceCenter = jest
        .fn()
        .mockRejectedValue(error);

      // Act
      await resourceCenterController.createResourceCenter(
        mockRequest as Request<unknown, unknown, CreateResourceCenterDto>,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.createResourceCenter,
      ).toHaveBeenCalledWith(dummyCreateResourceCenterDto);
      expect(mockSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to create resource center.',
        500,
        error,
      );
    });
  });

  describe('updateResourceCenter', () => {
    it('should update a resource center successfully', async () => {
      // Arrange
      const currentUser = {
        id: '507f1f77bcf86cd799439012',
        projectId: '507f1f77bcf86cd799439016',
      };
      mockRequest.params = { resourceCenterId: '507f1f77bcf86cd799439013' };
      mockRequest.body = dummyUpdateResourceCenterDto;
      mockRequest.headers = {
        currentuser: JSON.stringify(currentUser),
      };
      mockResourceCenterService.updateResourceCenter = jest
        .fn()
        .mockResolvedValue(dummyResourceCenter);

      // Act
      await resourceCenterController.updateResourceCenter(
        mockRequest as Request<
          { resourceCenterId: string },
          unknown,
          UpdateResourceCenterDto
        >,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.updateResourceCenter,
      ).toHaveBeenCalledWith('507f1f77bcf86cd799439013', {
        ...dummyUpdateResourceCenterDto,
        projectId: '507f1f77bcf86cd799439016',
      });
      expect(mockSendUpdated).toHaveBeenCalledWith(
        mockResponse,
        dummyResourceCenter,
        'Resource center updated successfully',
      );
    });

    it('should return not found when resource center does not exist', async () => {
      // Arrange
      mockRequest.params = { resourceCenterId: '507f1f77bcf86cd799439013' };
      mockRequest.body = dummyUpdateResourceCenterDto;
      mockRequest.headers = {};
      mockResourceCenterService.updateResourceCenter = jest
        .fn()
        .mockResolvedValue(null);

      // Act
      await resourceCenterController.updateResourceCenter(
        mockRequest as Request<
          { resourceCenterId: string },
          unknown,
          UpdateResourceCenterDto
        >,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.updateResourceCenter,
      ).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439013',
        dummyUpdateResourceCenterDto,
      );
      expect(mockSendNotFound).toHaveBeenCalledWith(
        mockResponse,
        'Resource center not found',
      );
    });

    it('should handle error when updating resource center fails', async () => {
      // Arrange
      mockRequest.params = { resourceCenterId: '507f1f77bcf86cd799439013' };
      mockRequest.body = dummyUpdateResourceCenterDto;
      mockRequest.headers = {};
      const error = new Error('Database connection failed');
      mockResourceCenterService.updateResourceCenter = jest
        .fn()
        .mockRejectedValue(error);

      // Act
      await resourceCenterController.updateResourceCenter(
        mockRequest as Request<
          { resourceCenterId: string },
          unknown,
          UpdateResourceCenterDto
        >,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.updateResourceCenter,
      ).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439013',
        dummyUpdateResourceCenterDto,
      );
      expect(mockSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to update resource center.',
        500,
        error,
      );
    });
  });

  describe('getAllResourceCenters', () => {
    it('should get all resource centers successfully', async () => {
      // Arrange
      const resourceCenters = [dummyResourceCenter];
      mockResourceCenterService.getAllResourceCenters = jest
        .fn()
        .mockResolvedValue(resourceCenters);

      // Act
      await resourceCenterController.getAllResourceCenters(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.getAllResourceCenters,
      ).toHaveBeenCalled();
      expect(mockSendSuccess).toHaveBeenCalledWith(
        mockResponse,
        resourceCenters,
        'Successfully fetched all resource centers.',
      );
    });

    it('should handle error when getting all resource centers fails', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockResourceCenterService.getAllResourceCenters = jest
        .fn()
        .mockRejectedValue(error);

      // Act
      await resourceCenterController.getAllResourceCenters(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.getAllResourceCenters,
      ).toHaveBeenCalled();
      expect(mockSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to fetch resource centers.',
        500,
        error,
      );
    });
  });

  describe('getResourceCentersByFilters', () => {
    it('should get resource centers by filters successfully', async () => {
      // Arrange
      mockRequest.query = { tag: 'Demo', contentType: 'pdf' };
      const resourceCenters = [dummyResourceCenter];
      mockResourceCenterService.getResourceCentersByFilters = jest
        .fn()
        .mockResolvedValue(resourceCenters);

      // Act
      await resourceCenterController.getResourceCentersByFilters(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.getResourceCentersByFilters,
      ).toHaveBeenCalledWith('Demo', 'pdf');
      expect(mockSendSuccess).toHaveBeenCalledWith(
        mockResponse,
        resourceCenters,
        'Successfully fetched filtered resource centers.',
      );
    });

    it('should handle error when getting resource centers by filters fails', async () => {
      // Arrange
      mockRequest.query = { tag: 'Demo', contentType: 'pdf' };
      const error = new Error('Database connection failed');
      mockResourceCenterService.getResourceCentersByFilters = jest
        .fn()
        .mockRejectedValue(error);

      // Act
      await resourceCenterController.getResourceCentersByFilters(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.getResourceCentersByFilters,
      ).toHaveBeenCalledWith('Demo', 'pdf');
      expect(mockSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to fetch filtered resource centers.',
        500,
        error,
      );
    });
  });

  describe('getResourceCentersForAgents', () => {
    it('should get resource centers for agents successfully', async () => {
      // Arrange
      const currentUser = {
        id: '507f1f77bcf86cd799439012',
        roleId: '507f1f77bcf86cd799439020',
        channelId: '507f1f77bcf86cd799439014',
        projectId: '507f1f77bcf86cd799439016',
      };
      mockRequest.headers = {
        currentuser: JSON.stringify(currentUser),
      };
      mockRequest.query = {
        tag: 'Demo',
        contentType: 'pdf',
        resourceCategory: '507f1f77bcf86cd799439017',
        skip: '0',
        limit: '10',
      };
      const result = {
        data: [dummyResourceCenter],
        total: 1,
      };
      mockResourceCenterService.getResourceCentersForAgents = jest
        .fn()
        .mockResolvedValue(result);

      // Act
      await resourceCenterController.getResourceCentersForAgents(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.getResourceCentersForAgents,
      ).toHaveBeenCalledWith(
        'Demo',
        'pdf',
        '507f1f77bcf86cd799439020',
        '507f1f77bcf86cd799439014',
        '507f1f77bcf86cd799439017',
        '507f1f77bcf86cd799439016',
        0,
        10,
      );
      expect(mockSendSuccess).toHaveBeenCalledWith(
        mockResponse,
        {
          data: result.data,
          total: result.total,
          skip: 0,
          limit: 10,
        },
        'Successfully fetched filtered resource centers for agents.',
      );
    });

    it('should handle error when getting resource centers for agents fails', async () => {
      // Arrange
      mockRequest.headers = {};
      mockRequest.query = { tag: 'Demo', contentType: 'pdf' };
      const error = new Error('Database connection failed');
      mockResourceCenterService.getResourceCentersForAgents = jest
        .fn()
        .mockRejectedValue(error);

      // Act
      await resourceCenterController.getResourceCentersForAgents(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.getResourceCentersForAgents,
      ).toHaveBeenCalledWith(
        'Demo',
        'pdf',
        undefined,
        undefined,
        undefined,
        undefined,
        0,
        10,
      );
      expect(mockSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to fetch filtered resource centers for agents.',
        500,
        error,
      );
    });
  });

  describe('getResourceCenterWithDocuments', () => {
    it('should get resource center with documents successfully', async () => {
      // Arrange
      const currentUser = {
        id: '507f1f77bcf86cd799439012',
        projectId: '507f1f77bcf86cd799439016',
      };
      mockRequest.params = { resourceCenterId: '507f1f77bcf86cd799439013' };
      mockRequest.headers = {
        currentuser: JSON.stringify(currentUser),
      };
      const result = {
        ...dummyResourceCenter,
        documents: [dummyResourceCenterDocument],
      };
      mockResourceCenterService.getResourceCenterWithDocuments = jest
        .fn()
        .mockResolvedValue(result);

      // Act
      await resourceCenterController.getResourceCenterWithDocuments(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.getResourceCenterWithDocuments,
      ).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439013',
        '507f1f77bcf86cd799439016',
      );
      expect(mockSendSuccess).toHaveBeenCalledWith(
        mockResponse,
        result,
        'Successfully fetched resource center with documents.',
      );
    });

    it('should return not found when resource center does not exist', async () => {
      // Arrange
      mockRequest.params = { resourceCenterId: '507f1f77bcf86cd799439013' };
      mockRequest.headers = {};
      mockResourceCenterService.getResourceCenterWithDocuments = jest
        .fn()
        .mockResolvedValue(null);

      // Act
      await resourceCenterController.getResourceCenterWithDocuments(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.getResourceCenterWithDocuments,
      ).toHaveBeenCalledWith('507f1f77bcf86cd799439013', undefined);
      expect(mockSendNotFound).toHaveBeenCalledWith(
        mockResponse,
        'Resource center not found',
      );
    });

    it('should handle error when getting resource center with documents fails', async () => {
      // Arrange
      mockRequest.params = { resourceCenterId: '507f1f77bcf86cd799439013' };
      mockRequest.headers = {};
      const error = new Error('Database connection failed');
      mockResourceCenterService.getResourceCenterWithDocuments = jest
        .fn()
        .mockRejectedValue(error);

      // Act
      await resourceCenterController.getResourceCenterWithDocuments(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.getResourceCenterWithDocuments,
      ).toHaveBeenCalledWith('507f1f77bcf86cd799439013', undefined);
      expect(mockSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to fetch resource center with documents.',
        500,
        error,
      );
    });
  });

  describe('createResourceCenterDocument', () => {
    it('should create a resource center document successfully', async () => {
      // Arrange
      mockRequest.body = dummyCreateResourceCenterDocumentDto;
      mockRequest.file = dummyFile;
      mockResourceCenterService.createResourceCenterDocument = jest
        .fn()
        .mockResolvedValue(dummyResourceCenterDocument);

      // Act
      await resourceCenterController.createResourceCenterDocument(
        mockRequest as Request<
          unknown,
          unknown,
          CreateResourceCenterDocumentDto
        >,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.createResourceCenterDocument,
      ).toHaveBeenCalledWith(dummyCreateResourceCenterDocumentDto, dummyFile);
      expect(mockSendCreated).toHaveBeenCalledWith(
        mockResponse,
        dummyResourceCenterDocument,
        'Resource center document created successfully',
      );
    });

    it('should return bad request when no file is uploaded', async () => {
      // Arrange
      mockRequest.body = dummyCreateResourceCenterDocumentDto;
      mockRequest.file = undefined;

      // Act
      await resourceCenterController.createResourceCenterDocument(
        mockRequest as Request<
          unknown,
          unknown,
          CreateResourceCenterDocumentDto
        >,
        mockResponse as Response,
      );

      // Assert
      expect(mockSendBadRequest).toHaveBeenCalledWith(
        mockResponse,
        'No file uploaded',
      );
      expect(
        mockResourceCenterService.createResourceCenterDocument,
      ).not.toHaveBeenCalled();
    });

    it('should handle invalid file type error', async () => {
      // Arrange
      mockRequest.body = dummyCreateResourceCenterDocumentDto;
      mockRequest.file = dummyFile;
      const error = new Error(
        'Invalid file type. Only PDF, PNG, JPG, and MP4 are allowed',
      );
      mockResourceCenterService.createResourceCenterDocument = jest
        .fn()
        .mockRejectedValue(error);

      // Act
      await resourceCenterController.createResourceCenterDocument(
        mockRequest as Request<
          unknown,
          unknown,
          CreateResourceCenterDocumentDto
        >,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.createResourceCenterDocument,
      ).toHaveBeenCalledWith(dummyCreateResourceCenterDocumentDto, dummyFile);
      expect(mockSendError).toHaveBeenCalledWith(
        mockResponse,
        error.message,
        400,
        error,
      );
    });

    it('should handle general error when creating resource center document fails', async () => {
      // Arrange
      mockRequest.body = dummyCreateResourceCenterDocumentDto;
      mockRequest.file = dummyFile;
      const error = new Error('Database connection failed');
      mockResourceCenterService.createResourceCenterDocument = jest
        .fn()
        .mockRejectedValue(error);

      // Act
      await resourceCenterController.createResourceCenterDocument(
        mockRequest as Request<
          unknown,
          unknown,
          CreateResourceCenterDocumentDto
        >,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.createResourceCenterDocument,
      ).toHaveBeenCalledWith(dummyCreateResourceCenterDocumentDto, dummyFile);
      expect(mockSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to create resource center document.',
        500,
        error,
      );
    });
  });

  describe('updateResourceCenterDocument', () => {
    it('should update a resource center document successfully', async () => {
      // Arrange
      mockRequest.params = { id: '507f1f77bcf86cd799439023' };
      mockRequest.body = dummyUpdateResourceCenterDocumentDto;
      mockRequest.file = dummyFile;
      mockResourceCenterService.updateResourceCenterDocument = jest
        .fn()
        .mockResolvedValue(dummyResourceCenterDocument);

      // Act
      await resourceCenterController.updateResourceCenterDocument(
        mockRequest as Request<
          { id: string },
          unknown,
          UpdateResourceCenterDocumentDto
        >,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.updateResourceCenterDocument,
      ).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439023',
        dummyUpdateResourceCenterDocumentDto,
        dummyFile,
      );
      expect(mockSendUpdated).toHaveBeenCalledWith(
        mockResponse,
        dummyResourceCenterDocument,
        'Resource center document updated successfully',
      );
    });

    it('should return bad request when no file is uploaded', async () => {
      // Arrange
      mockRequest.params = { id: '507f1f77bcf86cd799439023' };
      mockRequest.body = dummyUpdateResourceCenterDocumentDto;
      mockRequest.file = undefined;

      // Act
      await resourceCenterController.updateResourceCenterDocument(
        mockRequest as Request<
          { id: string },
          unknown,
          UpdateResourceCenterDocumentDto
        >,
        mockResponse as Response,
      );

      // Assert
      expect(mockSendBadRequest).toHaveBeenCalledWith(
        mockResponse,
        'No file uploaded',
      );
      expect(
        mockResourceCenterService.updateResourceCenterDocument,
      ).not.toHaveBeenCalled();
    });

    it('should return not found when document does not exist', async () => {
      // Arrange
      mockRequest.params = { id: '507f1f77bcf86cd799439023' };
      mockRequest.body = dummyUpdateResourceCenterDocumentDto;
      mockRequest.file = dummyFile;
      mockResourceCenterService.updateResourceCenterDocument = jest
        .fn()
        .mockResolvedValue(null);

      // Act
      await resourceCenterController.updateResourceCenterDocument(
        mockRequest as Request<
          { id: string },
          unknown,
          UpdateResourceCenterDocumentDto
        >,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.updateResourceCenterDocument,
      ).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439023',
        dummyUpdateResourceCenterDocumentDto,
        dummyFile,
      );
      expect(mockSendNotFound).toHaveBeenCalledWith(
        mockResponse,
        'Resource center document not found',
      );
    });

    it('should handle error when updating resource center document fails', async () => {
      // Arrange
      mockRequest.params = { id: '507f1f77bcf86cd799439023' };
      mockRequest.body = dummyUpdateResourceCenterDocumentDto;
      mockRequest.file = dummyFile;
      const error = new Error('Database connection failed');
      mockResourceCenterService.updateResourceCenterDocument = jest
        .fn()
        .mockRejectedValue(error);

      // Act
      await resourceCenterController.updateResourceCenterDocument(
        mockRequest as Request<
          { id: string },
          unknown,
          UpdateResourceCenterDocumentDto
        >,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.updateResourceCenterDocument,
      ).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439023',
        dummyUpdateResourceCenterDocumentDto,
        dummyFile,
      );
      expect(mockSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to update resource center document.',
        500,
        error,
      );
    });
  });

  describe('patchResourceCenterFile', () => {
    it('should patch resource center file successfully', async () => {
      // Arrange
      const patchData = {
        resourceCenterId: '507f1f77bcf86cd799439013',
        documentId: '507f1f77bcf86cd799439022',
        s3Key: 'updated-s3-key',
        s3Link: 'https://bucket.s3.amazonaws.com/updated-s3-key',
        documentFormat: 'pdf',
      };
      mockRequest.body = patchData;
      mockResourceCenterService.getResourceCenterById = jest
        .fn()
        .mockResolvedValue({
          ...dummyResourceCenter,
          files: [
            {
              _id: '507f1f77bcf86cd799439022',
              s3Key: 'old-s3-key',
              s3Link: 'https://bucket.s3.amazonaws.com/old-s3-key',
              documentFormat: 'pdf',
              isActive: true,
            },
          ],
          save: jest.fn().mockResolvedValue(true),
        });

      // Act
      await resourceCenterController.patchResourceCenterFile(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.getResourceCenterById,
      ).toHaveBeenCalledWith('507f1f77bcf86cd799439013');
      expect(mockSendSuccess).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          s3Key: 'updated-s3-key',
          s3Link: 'https://bucket.s3.amazonaws.com/updated-s3-key',
          documentFormat: 'pdf',
        }),
        'Resource center file updated successfully',
      );
    });

    it('should return bad request when required fields are missing', async () => {
      // Arrange
      mockRequest.body = {
        resourceCenterId: '507f1f77bcf86cd799439013',
        // Missing other required fields
      };

      // Act
      await resourceCenterController.patchResourceCenterFile(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(mockSendBadRequest).toHaveBeenCalledWith(
        mockResponse,
        'resourceCenterId, documentId, s3Key, s3Link, and documentFormat are required',
      );
    });

    it('should return bad request when resourceCenterId is invalid', async () => {
      // Arrange
      mockRequest.body = {
        resourceCenterId: 'invalid-id',
        documentId: '507f1f77bcf86cd799439022',
        s3Key: 'updated-s3-key',
        s3Link: 'https://bucket.s3.amazonaws.com/updated-s3-key',
        documentFormat: 'pdf',
      };

      // Act
      await resourceCenterController.patchResourceCenterFile(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(mockSendBadRequest).toHaveBeenCalledWith(
        mockResponse,
        'Invalid resourceCenterId',
      );
    });

    it('should return not found when resource center does not exist', async () => {
      // Arrange
      mockRequest.body = {
        resourceCenterId: '507f1f77bcf86cd799439013',
        documentId: '507f1f77bcf86cd799439022',
        s3Key: 'updated-s3-key',
        s3Link: 'https://bucket.s3.amazonaws.com/updated-s3-key',
        documentFormat: 'pdf',
      };
      mockResourceCenterService.getResourceCenterById = jest
        .fn()
        .mockResolvedValue(null);

      // Act
      await resourceCenterController.patchResourceCenterFile(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.getResourceCenterById,
      ).toHaveBeenCalledWith('507f1f77bcf86cd799439013');
      expect(mockSendNotFound).toHaveBeenCalledWith(
        mockResponse,
        'Resource center not found',
      );
    });

    it('should return not found when document does not exist in files array', async () => {
      // Arrange
      mockRequest.body = {
        resourceCenterId: '507f1f77bcf86cd799439013',
        documentId: 'non-existent-document-id',
        s3Key: 'updated-s3-key',
        s3Link: 'https://bucket.s3.amazonaws.com/updated-s3-key',
        documentFormat: 'pdf',
      };
      mockResourceCenterService.getResourceCenterById = jest
        .fn()
        .mockResolvedValue({
          ...dummyResourceCenter,
          files: [
            {
              _id: '507f1f77bcf86cd799439022',
              s3Key: 'old-s3-key',
              s3Link: 'https://bucket.s3.amazonaws.com/old-s3-key',
              documentFormat: 'pdf',
              isActive: true,
            },
          ],
        });

      // Act
      await resourceCenterController.patchResourceCenterFile(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.getResourceCenterById,
      ).toHaveBeenCalledWith('507f1f77bcf86cd799439013');
      expect(mockSendNotFound).toHaveBeenCalledWith(
        mockResponse,
        'Document not found in resource center files',
      );
    });

    it('should handle error when patching resource center file fails', async () => {
      // Arrange
      mockRequest.body = {
        resourceCenterId: '507f1f77bcf86cd799439013',
        documentId: '507f1f77bcf86cd799439022',
        s3Key: 'updated-s3-key',
        s3Link: 'https://bucket.s3.amazonaws.com/updated-s3-key',
        documentFormat: 'pdf',
      };
      const error = new Error('Database connection failed');
      mockResourceCenterService.getResourceCenterById = jest
        .fn()
        .mockRejectedValue(error);

      // Act
      await resourceCenterController.patchResourceCenterFile(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(
        mockResourceCenterService.getResourceCenterById,
      ).toHaveBeenCalledWith('507f1f77bcf86cd799439013');
      expect(mockSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to patch resource center file.',
        500,
        error,
      );
    });
  });
});
