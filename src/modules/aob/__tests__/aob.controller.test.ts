import { AobController } from '../aob.controller';
import { AobService } from '../aob.service';
import { ApplicationApprovalService } from '../services/application-approval.service';
import { HTTP_STATUS } from '@/common/constants/http-status.constants';
import type { Request, Response } from 'express';
import type { CreateAobDocumentMasterDto } from '../dto/create-aob-document-master.dto';
import type { ShareableLinkDto } from '../dto/shareable-link.dto';

// Mock the logger
jest.mock('@/common/utils/logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

// Mock the services
jest.mock('../aob.service');
jest.mock('../services/application-approval.service');

// Mock models
jest.mock('@/models/aob-application.model', () => ({
  AobApplicationModel: {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    updateOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    aggregate: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('@/models/aob-document.model', () => ({
  AobDocumentModel: {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('@/models/aob-document-history.model', () => ({
  AobDocumentHistoryModel: {
    create: jest.fn(),
  },
}));

// Create a test controller class that exposes protected methods
class TestAobController extends AobController {
  public testSendCreated = jest.fn();
  public testSendSuccess = jest.fn();
  public testSendBadRequest = jest.fn();
  public testSendNotFound = jest.fn();
  public testSendError = jest.fn();

  protected sendCreated(res: any, data: any, message: string): void {
    this.testSendCreated(res, data, message);
  }

  protected sendSuccess(res: any, data: any, message: string): void {
    this.testSendSuccess(res, data, message);
  }

  protected sendBadRequest(res: any, message: string): void {
    this.testSendBadRequest(res, message);
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

describe('AobController', () => {
  let controller: TestAobController;
  let mockAobService: jest.Mocked<AobService>;
  let mockApplicationApprovalService: jest.Mocked<ApplicationApprovalService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock service instances
    mockAobService = {
      createDocumentMaster: jest.fn(),
      createBulkDocumentMasters: jest.fn(),
      getAllDocumentMasters: jest.fn(),
      getDocumentMasterById: jest.fn(),
      getDocumentMastersByCategory: jest.fn(),
      batchUpdateDocumentStatus: jest.fn(),
      getQcHistoryList: jest.fn(),
      sendShareableLinkEmail: jest.fn(),
      sendShareableLinkSms: jest.fn(),
    } as any;

    mockApplicationApprovalService = {
      processApprovedApplication: jest.fn(),
    } as any;

    // Mock the service constructors
    (AobService as jest.MockedClass<typeof AobService>).mockImplementation(
      () => mockAobService,
    );
    (
      ApplicationApprovalService as jest.MockedClass<
        typeof ApplicationApprovalService
      >
    ).mockImplementation(() => mockApplicationApprovalService);

    controller = new TestAobController();

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
    controller.testSendBadRequest.mockClear();
    controller.testSendNotFound.mockClear();
    controller.testSendError.mockClear();
  });

  describe('createDocumentMaster', () => {
    const mockDocumentMaster = {
      _id: '507f1f77bcf86cd799439011',
      documentName: 'Test Document',
      documentType: 'testType',
      documentDescription: 'Test Description',
      documentInstruction: 'Test Instruction',
      category: 'test',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create document master successfully', async () => {
      const createData: CreateAobDocumentMasterDto = {
        documentName: 'Test Document',
        documentType: 'testType',
        documentDescription: 'Test Description',
        documentInstruction: 'Test Instruction',
        category: 'test',
      };

      mockRequest.body = createData;
      mockAobService.createDocumentMaster.mockResolvedValue(mockDocumentMaster);

      await controller.createDocumentMaster(
        mockRequest as Request<unknown, unknown, CreateAobDocumentMasterDto>,
        mockResponse as Response,
      );

      expect(mockAobService.createDocumentMaster).toHaveBeenCalledWith(
        createData,
      );
      expect(controller.testSendCreated).toHaveBeenCalledWith(
        mockResponse,
        mockDocumentMaster,
        'Document master created successfully',
      );
    });

    it('should handle service error', async () => {
      const createData: CreateAobDocumentMasterDto = {
        documentName: 'Test Document',
        documentType: 'testType',
        documentDescription: 'Test Description',
        documentInstruction: 'Test Instruction',
      };

      mockRequest.body = createData;
      const serviceError = new Error('Service error');
      mockAobService.createDocumentMaster.mockRejectedValue(serviceError);

      await controller.createDocumentMaster(
        mockRequest as Request<unknown, unknown, CreateAobDocumentMasterDto>,
        mockResponse as Response,
      );

      expect(controller.testSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to create document master.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        serviceError,
      );
    });
  });

  describe('createBulkDocumentMasters', () => {
    const mockDocumentMasters = [
      {
        _id: '507f1f77bcf86cd799439011',
        documentName: 'Test Document 1',
        documentType: 'testType1',
        documentDescription: 'Test Description 1',
        documentInstruction: 'Test Instruction 1',
        category: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: '507f1f77bcf86cd799439012',
        documentName: 'Test Document 2',
        documentType: 'testType2',
        documentDescription: 'Test Description 2',
        documentInstruction: 'Test Instruction 2',
        category: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should create bulk document masters with direct array format', async () => {
      const documentsArray = [
        {
          documentName: 'Test Document 1',
          documentType: 'testType1',
          documentDescription: 'Test Description 1',
          documentInstruction: 'Test Instruction 1',
        },
        {
          documentName: 'Test Document 2',
          documentType: 'testType2',
          documentDescription: 'Test Description 2',
          documentInstruction: 'Test Instruction 2',
        },
      ];

      mockRequest.body = documentsArray;
      mockAobService.createBulkDocumentMasters.mockResolvedValue(
        mockDocumentMasters,
      );

      await controller.createBulkDocumentMasters(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn(),
      );

      expect(mockAobService.createBulkDocumentMasters).toHaveBeenCalledWith({
        documents: documentsArray,
      });
      expect(controller.testSendCreated).toHaveBeenCalledWith(
        mockResponse,
        mockDocumentMasters,
        'Successfully created 2 document masters',
      );
    });

    it('should create bulk document masters with wrapped object format', async () => {
      const documentsArray = [
        {
          documentName: 'Test Document 1',
          documentType: 'testType1',
          documentDescription: 'Test Description 1',
          documentInstruction: 'Test Instruction 1',
        },
      ];

      mockRequest.body = { documents: documentsArray };
      mockAobService.createBulkDocumentMasters.mockResolvedValue([
        mockDocumentMasters[0],
      ]);

      await controller.createBulkDocumentMasters(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn(),
      );

      expect(mockAobService.createBulkDocumentMasters).toHaveBeenCalledWith({
        documents: documentsArray,
      });
      expect(controller.testSendCreated).toHaveBeenCalledWith(
        mockResponse,
        [mockDocumentMasters[0]],
        'Successfully created 1 document masters',
      );
    });

    it('should handle invalid request format', async () => {
      mockRequest.body = { invalid: 'format' };

      await controller.createBulkDocumentMasters(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn(),
      );

      expect(controller.testSendBadRequest).toHaveBeenCalledWith(
        mockResponse,
        'Invalid request format. Expected array of documents or object with documents property.',
      );
    });

    it('should handle service error', async () => {
      const documentsArray = [
        {
          documentName: 'Test Document',
          documentType: 'testType',
          documentDescription: 'Test Description',
          documentInstruction: 'Test Instruction',
        },
      ];

      mockRequest.body = documentsArray;
      const serviceError = new Error('Service error');
      mockAobService.createBulkDocumentMasters.mockRejectedValue(serviceError);

      await controller.createBulkDocumentMasters(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn(),
      );

      expect(controller.testSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to create document masters.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        serviceError,
      );
    });
  });

  describe('getAllDocumentMasters', () => {
    it('should get all document masters successfully', async () => {
      const mockDocumentMasters = [
        {
          _id: '507f1f77bcf86cd799439011',
          documentName: 'Test Document',
          documentType: 'testType',
          documentDescription: 'Test Description',
          documentInstruction: 'Test Instruction',
          category: 'test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockAobService.getAllDocumentMasters.mockResolvedValue(
        mockDocumentMasters,
      );

      await controller.getAllDocumentMasters(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockAobService.getAllDocumentMasters).toHaveBeenCalledTimes(1);
      expect(controller.testSendSuccess).toHaveBeenCalledWith(
        mockResponse,
        mockDocumentMasters,
        'Successfully fetched all document masters.',
      );
    });

    it('should handle service error', async () => {
      const serviceError = new Error('Service error');
      mockAobService.getAllDocumentMasters.mockRejectedValue(serviceError);

      await controller.getAllDocumentMasters(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(controller.testSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to fetch document masters.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        serviceError,
      );
    });
  });

  describe('getDocumentMasterById', () => {
    const mockDocumentMaster = {
      _id: '507f1f77bcf86cd799439011',
      documentName: 'Test Document',
      documentType: 'testType',
      documentDescription: 'Test Description',
      documentInstruction: 'Test Instruction',
      category: 'test',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should get document master by ID successfully', async () => {
      mockRequest.params = { id: '507f1f77bcf86cd799439011' };
      mockAobService.getDocumentMasterById.mockResolvedValue(
        mockDocumentMaster,
      );

      await controller.getDocumentMasterById(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockAobService.getDocumentMasterById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(controller.testSendSuccess).toHaveBeenCalledWith(
        mockResponse,
        mockDocumentMaster,
        'Successfully fetched document master.',
      );
    });

    it('should return not found when document master does not exist', async () => {
      mockRequest.params = { id: '507f1f77bcf86cd799439011' };
      mockAobService.getDocumentMasterById.mockResolvedValue(null);

      await controller.getDocumentMasterById(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(controller.testSendNotFound).toHaveBeenCalledWith(
        mockResponse,
        'Document master not found',
      );
    });

    it('should handle service error', async () => {
      mockRequest.params = { id: '507f1f77bcf86cd799439011' };
      const serviceError = new Error('Service error');
      mockAobService.getDocumentMasterById.mockRejectedValue(serviceError);

      await controller.getDocumentMasterById(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(controller.testSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to fetch document master.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        serviceError,
      );
    });
  });

  describe('getDocumentMastersByCategory', () => {
    const mockDocumentMasters = [
      {
        _id: '507f1f77bcf86cd799439011',
        documentName: 'Test Document',
        documentType: 'testType',
        documentDescription: 'Test Description',
        documentInstruction: 'Test Instruction',
        category: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should get document masters by category successfully', async () => {
      mockRequest.query = { category: 'test' };
      mockAobService.getDocumentMastersByCategory.mockResolvedValue(
        mockDocumentMasters,
      );

      await controller.getDocumentMastersByCategory(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockAobService.getDocumentMastersByCategory).toHaveBeenCalledWith(
        'test',
      );
      expect(controller.testSendSuccess).toHaveBeenCalledWith(
        mockResponse,
        mockDocumentMasters,
        'Successfully fetched document masters for category: test',
      );
    });

    it('should handle missing category parameter', async () => {
      mockRequest.query = {};

      await controller.getDocumentMastersByCategory(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(controller.testSendBadRequest).toHaveBeenCalledWith(
        mockResponse,
        'Category parameter is required',
      );
    });

    it('should handle invalid category parameter type', async () => {
      mockRequest.query = { category: 123 as any };

      await controller.getDocumentMastersByCategory(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(controller.testSendBadRequest).toHaveBeenCalledWith(
        mockResponse,
        'Category parameter is required',
      );
    });

    it('should handle service error', async () => {
      mockRequest.query = { category: 'test' };
      const serviceError = new Error('Service error');
      mockAobService.getDocumentMastersByCategory.mockRejectedValue(
        serviceError,
      );

      await controller.getDocumentMastersByCategory(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(controller.testSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to fetch document masters by category.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        serviceError,
      );
    });
  });

  describe('batchUpdateDocumentStatus', () => {
    const mockBatchUpdateData = {
      applicationId: 'APP123456789',
      projectId: '507f1f77bcf86cd799439011',
      documents: [
        {
          _id: '507f1f77bcf86cd799439012',
          documentId: 'DOC123',
          documentStatus: 'approve' as const,
          remarks: 'Approved',
          type: 'main',
          infoName: 'Main Document',
        },
      ],
    };

    it('should batch update document status successfully', async () => {
      mockRequest.body = mockBatchUpdateData;
      const mockResult = {
        success: true,
        results: [
          {
            _id: '507f1f77bcf86cd799439012',
            documentId: 'DOC123',
            success: true,
            status: 'approve',
          },
        ],
      };
      mockAobService.batchUpdateDocumentStatus.mockResolvedValue(mockResult);

      await controller.batchUpdateDocumentStatus(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockAobService.batchUpdateDocumentStatus).toHaveBeenCalledWith(
        'APP123456789',
        mockBatchUpdateData.documents,
        '507f1f77bcf86cd799439011',
      );
      expect(controller.testSendSuccess).toHaveBeenCalledWith(
        mockResponse,
        mockResult,
        'Documents status updated successfully',
      );
    });

    it('should handle missing required fields', async () => {
      // Test missing documents array
      mockRequest.body = { applicationId: 'APP123' };

      await controller.batchUpdateDocumentStatus(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(controller.testSendBadRequest).toHaveBeenCalledWith(
        mockResponse,
        'Application ID and at least one document are required',
      );
    });

    it('should handle empty documents array', async () => {
      // Test empty documents array
      mockRequest.body = { applicationId: 'APP123', documents: [] };

      await controller.batchUpdateDocumentStatus(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(controller.testSendBadRequest).toHaveBeenCalledWith(
        mockResponse,
        'Application ID and at least one document are required',
      );
    });

    it('should handle missing applicationId', async () => {
      // Test missing applicationId
      mockRequest.body = {
        documents: [
          { _id: '123', documentId: 'DOC123', documentStatus: 'approve' },
        ],
      };

      await controller.batchUpdateDocumentStatus(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(controller.testSendBadRequest).toHaveBeenCalledWith(
        mockResponse,
        'Application ID and at least one document are required',
      );
    });

    it('should handle missing remarks for reject status', async () => {
      mockRequest.body = {
        applicationId: 'APP123456789',
        documents: [
          {
            _id: '507f1f77bcf86cd799439012',
            documentId: 'DOC123',
            documentStatus: 'reject' as const,
            // Missing remarks
          },
        ],
      };

      await controller.batchUpdateDocumentStatus(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Remarks are required for rejected document: DOC123',
      });
    });

    it('should handle service error with not found message', async () => {
      mockRequest.body = mockBatchUpdateData;
      const serviceError = new Error('Application not found');
      mockAobService.batchUpdateDocumentStatus.mockRejectedValue(serviceError);

      await controller.batchUpdateDocumentStatus(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(controller.testSendNotFound).toHaveBeenCalledWith(
        mockResponse,
        'Application not found',
      );
    });

    it('should handle general service error', async () => {
      mockRequest.body = mockBatchUpdateData;
      const serviceError = new Error('Database error');
      mockAobService.batchUpdateDocumentStatus.mockRejectedValue(serviceError);

      await controller.batchUpdateDocumentStatus(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(controller.testSendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to update document statuses',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        serviceError,
      );
    });
  });

  describe('shareableLink', () => {
    it('should send email notification successfully', async () => {
      const shareableLinkData: ShareableLinkDto = {
        link: 'https://example.com/share',
        notifyType: 'email',
        emailId: 'test@example.com',
      };

      mockRequest.body = shareableLinkData;
      mockAobService.sendShareableLinkEmail.mockResolvedValue();

      await controller.shareableLink(
        mockRequest as Request<any, any, ShareableLinkDto>,
        mockResponse as Response,
      );

      expect(mockAobService.sendShareableLinkEmail).toHaveBeenCalledWith(
        'test@example.com',
        'https://example.com/share',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Successful mail has been sent',
        data: {
          notifyType: 'email',
          recipient: 'test@example.com',
        },
        timestamp: expect.any(String),
      });
    });

    it('should send SMS notification successfully', async () => {
      const shareableLinkData: ShareableLinkDto = {
        link: 'https://example.com/share',
        notifyType: 'sms',
        smsNo: '+1234567890',
      };

      mockRequest.body = shareableLinkData;
      mockAobService.sendShareableLinkSms.mockResolvedValue();

      await controller.shareableLink(
        mockRequest as Request<any, any, ShareableLinkDto>,
        mockResponse as Response,
      );

      expect(mockAobService.sendShareableLinkSms).toHaveBeenCalledWith(
        '+1234567890',
        'https://example.com/share',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    it('should handle missing email ID for email notification', async () => {
      const shareableLinkData: ShareableLinkDto = {
        link: 'https://example.com/share',
        notifyType: 'email',
        // Missing emailId
      };

      mockRequest.body = shareableLinkData;

      await controller.shareableLink(
        mockRequest as Request<any, any, ShareableLinkDto>,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email ID is required when notify type is email',
        timestamp: expect.any(String),
      });
    });

    it('should handle missing SMS number for SMS notification', async () => {
      const shareableLinkData: ShareableLinkDto = {
        link: 'https://example.com/share',
        notifyType: 'sms',
        // Missing smsNo
      };

      mockRequest.body = shareableLinkData;

      await controller.shareableLink(
        mockRequest as Request<any, any, ShareableLinkDto>,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'SMS number is required when notify type is sms',
        timestamp: expect.any(String),
      });
    });

    it('should handle service error', async () => {
      const shareableLinkData: ShareableLinkDto = {
        link: 'https://example.com/share',
        notifyType: 'email',
        emailId: 'test@example.com',
      };

      mockRequest.body = shareableLinkData;
      const serviceError = new Error('Email service error');
      mockAobService.sendShareableLinkEmail.mockRejectedValue(serviceError);

      await controller.shareableLink(
        mockRequest as Request<any, any, ShareableLinkDto>,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to send notification',
        error: 'Email service error',
        timestamp: expect.any(String),
      });
    });
  });

  describe('inheritance from BaseController', () => {
    it('should extend BaseController', () => {
      expect(controller).toBeInstanceOf(AobController);
      // BaseController methods should be available through test class
      expect(typeof controller.testSendCreated).toBe('function');
      expect(typeof controller.testSendSuccess).toBe('function');
      expect(typeof controller.testSendBadRequest).toBe('function');
      expect(typeof controller.testSendNotFound).toBe('function');
      expect(typeof controller.testSendError).toBe('function');
    });
  });

  describe('constructor', () => {
    it('should initialize services correctly', () => {
      const newController = new AobController();
      expect(newController).toBeInstanceOf(AobController);
      expect(AobService).toHaveBeenCalled();
      expect(ApplicationApprovalService).toHaveBeenCalled();
    });
  });
});
