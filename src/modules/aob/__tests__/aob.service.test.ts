/**
 * @jest-environment node
 */

import { AobService } from '@/modules/aob/aob.service';
import { AobRepository } from '@/modules/aob/aob.repository';
import { AobDocumentModel } from '@/models/aob-document.model';
import { AobApplicationModel } from '@/models/aob-application.model';
import { AobDocumentHistoryModel } from '@/models/aob-document-history.model';
import { ApplicantOtpModel } from '@/models/applicant-otp.model';
import { AobEmailTemplates } from '@/emailTemplates/aob.templates';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import type {
  CreateAobDocumentMasterDto,
  BulkCreateAobDocumentMasterDto,
} from '@/modules/aob/dto/create-aob-document-master.dto';
import type { DocumentStatusUpdateDto } from '@/modules/aob/dto/batch-update-document-status.dto';

// Mock all dependencies
jest.mock('@/modules/aob/aob.repository');
jest.mock('@aws-sdk/client-s3');
jest.mock('nodemailer');
jest.mock('mongoose', () => ({
  Schema: jest.fn().mockImplementation(() => ({
    index: jest.fn(),
    virtual: jest.fn(() => ({ get: jest.fn(), set: jest.fn() })),
    pre: jest.fn(),
    post: jest.fn(),
  })),
  model: jest.fn(),
  connect: jest.fn(),
  Types: {
    ObjectId: Object.assign(
      jest.fn().mockImplementation(id => ({
        toString: () => (id ?? 'mock-object-id') as unknown as string,
      })),
      {
        isValid: jest.fn().mockReturnValue(true),
      },
    ),
  },
}));
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

// Mock database models
jest.mock('@/models/aob-document.model', () => ({
  AobDocumentModel: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.mock('@/models/aob-application.model', () => ({
  AobApplicationModel: {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    updateOne: jest.fn(),
  },
}));

jest.mock('@/models/aob-document-history.model', () => ({
  AobDocumentHistoryModel: {
    find: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('@/models/applicant-otp.model', () => ({
  ApplicantOtpModel: {
    findOne: jest.fn(),
    deleteMany: jest.fn(),
    deleteOne: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
  },
}));

// Mock logger
jest.mock('@/common/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('AobService', () => {
  let aobService: AobService;
  let mockAobRepository: jest.Mocked<AobRepository>;
  let mockS3Client: jest.Mocked<S3Client>;
  let mockEmailTransporter: jest.Mocked<nodemailer.Transporter>;

  // Mock data
  const mockDocumentMaster = {
    _id: new mongoose.Types.ObjectId(),
    documentName: 'Test Document',
    documentType: 'passport',
    documentDescription: 'Test Description',
    documentInstruction: 'Test Instruction',
    category: 'identity',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreateDocumentMasterDto: CreateAobDocumentMasterDto = {
    documentName: 'Test Document',
    documentType: 'passport',
    documentDescription: 'Test Description',
    documentInstruction: 'Test Instruction',
    category: 'identity',
  };

  const mockApplication = {
    _id: new mongoose.Types.ObjectId(),
    applicationId: 'APP123',
    documentId: 'DOC123',
    firstName: 'John',
    lastName: 'Doe',
    emailAddress: 'john.doe@example.com',
    mobileNumber: '1234567890',
    applicationStatus: 'pending',
    projectId: new mongoose.Types.ObjectId(),
    qcAndDiscrepencyList: [],
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('test content'),
    destination: '',
    filename: '',
    path: '',
    stream: {} as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    mockAobRepository = {
      createDocumentMaster: jest.fn(),
      createManyDocumentMasters: jest.fn(),
      findAllDocumentMasters: jest.fn(),
      findDocumentMasterById: jest.fn(),
      findDocumentMastersByCategory: jest.fn(),
      findDocumentMasterByType: jest.fn(),
    } as any;

    mockS3Client = {
      send: jest.fn(),
    } as any;

    mockEmailTransporter = {
      sendMail: jest.fn(),
    } as any;

    (
      AobRepository as jest.MockedClass<typeof AobRepository>
    ).mockImplementation(() => mockAobRepository);
    (S3Client as jest.MockedClass<typeof S3Client>).mockImplementation(
      () => mockS3Client,
    );
    (nodemailer.createTransport as jest.Mock).mockReturnValue(
      mockEmailTransporter,
    );

    // Mock environment variables
    process.env.AWS_REGION = 'ap-southeast-1';
    process.env.AWS_S3_BUCKET = 'test-bucket';
    process.env.GMAIL_USER = 'test@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'test-password';

    aobService = new AobService();
  });

  describe('createDocumentMaster', () => {
    it('should create document master successfully', async () => {
      mockAobRepository.createDocumentMaster.mockResolvedValue(
        mockDocumentMaster as never,
      );

      const result = await aobService.createDocumentMaster(
        mockCreateDocumentMasterDto,
      );

      expect(mockAobRepository.createDocumentMaster).toHaveBeenCalledWith(
        mockCreateDocumentMasterDto,
      );
      expect(result).toEqual({
        _id: mockDocumentMaster._id.toString(),
        documentName: mockDocumentMaster.documentName,
        documentType: mockDocumentMaster.documentType,
        documentDescription: mockDocumentMaster.documentDescription,
        documentInstruction: mockDocumentMaster.documentInstruction,
        category: mockDocumentMaster.category,
        createdAt: mockDocumentMaster.createdAt,
        updatedAt: mockDocumentMaster.updatedAt,
      });
    });

    it('should handle error when creating document master fails', async () => {
      const error = new Error('Database error');
      mockAobRepository.createDocumentMaster.mockRejectedValue(error);

      await expect(
        aobService.createDocumentMaster(mockCreateDocumentMasterDto),
      ).rejects.toThrow('Database error');
    });
  });

  describe('createBulkDocumentMasters', () => {
    const mockBulkCreateDto: BulkCreateAobDocumentMasterDto = {
      documents: [mockCreateDocumentMasterDto],
    };

    it('should create bulk document masters successfully', async () => {
      mockAobRepository.createManyDocumentMasters.mockResolvedValue([
        mockDocumentMaster,
      ] as never);

      const result =
        await aobService.createBulkDocumentMasters(mockBulkCreateDto);

      expect(mockAobRepository.createManyDocumentMasters).toHaveBeenCalledWith(
        mockBulkCreateDto.documents,
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        _id: mockDocumentMaster._id.toString(),
        documentName: mockDocumentMaster.documentName,
        documentType: mockDocumentMaster.documentType,
        documentDescription: mockDocumentMaster.documentDescription,
        documentInstruction: mockDocumentMaster.documentInstruction,
        category: mockDocumentMaster.category,
        createdAt: mockDocumentMaster.createdAt,
        updatedAt: mockDocumentMaster.updatedAt,
      });
    });

    it('should throw error when documents array is empty', async () => {
      const emptyBulkDto: BulkCreateAobDocumentMasterDto = {
        documents: [],
      };

      await expect(
        aobService.createBulkDocumentMasters(emptyBulkDto),
      ).rejects.toThrow('Documents array cannot be empty');
    });

    it('should throw error when document is missing required fields', async () => {
      const invalidBulkDto: BulkCreateAobDocumentMasterDto = {
        documents: [{ documentName: 'Test' } as any],
      };

      await expect(
        aobService.createBulkDocumentMasters(invalidBulkDto),
      ).rejects.toThrow('Document at index 0 is missing required fields');
    });
  });

  describe('getAllDocumentMasters', () => {
    it('should fetch all document masters successfully', async () => {
      mockAobRepository.findAllDocumentMasters.mockResolvedValue([
        mockDocumentMaster,
      ] as never);

      const result = await aobService.getAllDocumentMasters();

      expect(mockAobRepository.findAllDocumentMasters).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should handle error when fetching all document masters fails', async () => {
      const error = new Error('Database error');
      mockAobRepository.findAllDocumentMasters.mockRejectedValue(error);

      await expect(aobService.getAllDocumentMasters()).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getDocumentMasterById', () => {
    const testId = 'test-id';

    it('should fetch document master by ID successfully', async () => {
      mockAobRepository.findDocumentMasterById.mockResolvedValue(
        mockDocumentMaster as never,
      );

      const result = await aobService.getDocumentMasterById(testId);

      expect(mockAobRepository.findDocumentMasterById).toHaveBeenCalledWith(
        testId,
      );
      expect(result).toBeDefined();
    });

    it('should return null when document master not found', async () => {
      mockAobRepository.findDocumentMasterById.mockResolvedValue(null);

      const result = await aobService.getDocumentMasterById(testId);

      expect(result).toBeNull();
    });

    it('should handle error when fetching document master by ID fails', async () => {
      const error = new Error('Database error');
      mockAobRepository.findDocumentMasterById.mockRejectedValue(error);

      await expect(aobService.getDocumentMasterById(testId)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getDocumentMastersByCategory', () => {
    const testCategory = 'identity';

    it('should fetch document masters by category successfully', async () => {
      mockAobRepository.findDocumentMastersByCategory.mockResolvedValue([
        mockDocumentMaster,
      ] as never);

      const result =
        await aobService.getDocumentMastersByCategory(testCategory);

      expect(
        mockAobRepository.findDocumentMastersByCategory,
      ).toHaveBeenCalledWith(testCategory);
      expect(result).toHaveLength(1);
    });

    it('should handle error when fetching document masters by category fails', async () => {
      const error = new Error('Database error');
      mockAobRepository.findDocumentMastersByCategory.mockRejectedValue(error);

      await expect(
        aobService.getDocumentMastersByCategory(testCategory),
      ).rejects.toThrow('Database error');
    });
  });

  describe('uploadDocument', () => {
    const documentId = 'DOC123';
    const documentType = 'passport';
    const documentFormat = 'pdf';
    const documentStatus = 'approve' as const;

    beforeEach(() => {
      mockAobRepository.findDocumentMasterByType.mockResolvedValue(
        mockDocumentMaster as never,
      );
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication,
      );
      (AobApplicationModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        mockApplication,
      );
      (AobDocumentModel.findOneAndUpdate as jest.Mock).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        documentId,
        applicationId: mockApplication.applicationId,
        documentStatus,
        documentType,
        documentFormat,
        documentName: mockFile.originalname,
        presignedS3Url:
          'https://test-bucket.s3.ap-southeast-1.amazonaws.com/mock-uuid-1234.pdf',
        s3Key: 'mock-uuid-1234.pdf',
        remarks: undefined,
      });
      (AobDocumentHistoryModel.create as jest.Mock).mockResolvedValue({});
      mockS3Client.send.mockResolvedValue({} as never);
    });

    it('should upload document successfully with approve status', async () => {
      const result = await aobService.uploadDocument(
        documentId,
        documentType,
        documentFormat,
        documentStatus,
        mockFile,
      );

      expect(mockAobRepository.findDocumentMasterByType).toHaveBeenCalledWith(
        documentType,
      );
      expect(AobApplicationModel.findOne).toHaveBeenCalledWith({ documentId });
      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.any(PutObjectCommand),
      );
      expect(AobDocumentModel.findOneAndUpdate).toHaveBeenCalled();
      expect(AobDocumentHistoryModel.create).toHaveBeenCalled();
      expect(result).toHaveProperty('document');
    });

    it('should handle reject status', async () => {
      const rejectStatus = 'reject' as const;
      await aobService.uploadDocument(
        documentId,
        documentType,
        documentFormat,
        rejectStatus,
        mockFile,
      );

      expect(AobApplicationModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockApplication._id,
        expect.objectContaining({
          $push: expect.objectContaining({
            qcAndDiscrepencyList: expect.any(Object),
          }),
        }),
        { new: true },
      );
    });

    it('should handle qcReject status', async () => {
      const qcRejectStatus = 'qcReject' as const;
      await aobService.uploadDocument(
        documentId,
        documentType,
        documentFormat,
        qcRejectStatus,
        mockFile,
      );

      expect(AobApplicationModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockApplication._id,
        expect.objectContaining({
          applicationStatus: 'qcRejected',
          $push: expect.objectContaining({
            qcAndDiscrepencyList: expect.any(Object),
          }),
        }),
        { new: true },
      );
    });

    it('should throw error when document type is invalid', async () => {
      mockAobRepository.findDocumentMasterByType.mockResolvedValue(null);

      await expect(
        aobService.uploadDocument(
          documentId,
          documentType,
          documentFormat,
          documentStatus,
          mockFile,
        ),
      ).rejects.toThrow('Invalid document type');
    });

    it('should throw error when application not found', async () => {
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        aobService.uploadDocument(
          documentId,
          documentType,
          documentFormat,
          documentStatus,
          mockFile,
        ),
      ).rejects.toThrow('Application not found');
    });

    it('should throw error when file type is invalid', async () => {
      const invalidFile = { ...mockFile, mimetype: 'text/plain' };

      await expect(
        aobService.uploadDocument(
          documentId,
          documentType,
          documentFormat,
          documentStatus,
          invalidFile,
        ),
      ).rejects.toThrow(
        'Invalid file type. Only PDF, PNG, and JPG are allowed',
      );
    });

    it('should throw error when S3 upload fails', async () => {
      mockS3Client.send.mockRejectedValue(new Error('S3 error') as never);

      await expect(
        aobService.uploadDocument(
          documentId,
          documentType,
          documentFormat,
          documentStatus,
          mockFile,
        ),
      ).rejects.toThrow('Failed to upload file to S3');
    });
  });

  describe('getQcHistoryList', () => {
    const documentId = 'DOC123';

    it('should fetch QC history successfully', async () => {
      const mockHistory = [
        {
          documentId,
          documentStatus: 'approve',
          createdAt: new Date(),
        },
      ];
      (AobDocumentHistoryModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockHistory),
        }),
      });

      const result = await aobService.getQcHistoryList(documentId);

      expect(AobDocumentHistoryModel.find).toHaveBeenCalledWith({ documentId });
      expect(result).toEqual(mockHistory);
    });

    it('should handle error when fetching QC history fails', async () => {
      const error = new Error('Database error');
      (AobDocumentHistoryModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockRejectedValue(error),
        }),
      });

      await expect(aobService.getQcHistoryList(documentId)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('checkApplicantExists', () => {
    const emailId = 'test@example.com';

    beforeEach(() => {
      (ApplicantOtpModel.deleteMany as jest.Mock).mockResolvedValue({});
      (ApplicantOtpModel.create as jest.Mock).mockResolvedValue({});
      mockEmailTransporter.sendMail.mockResolvedValue({} as any);
    });

    it('should return exists true when applicant found in development', async () => {
      process.env.NODE_ENV = 'development';
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication,
      );

      const result = await aobService.checkApplicantExists(emailId);

      expect(AobApplicationModel.findOne).toHaveBeenCalledWith({
        emailAddress: emailId,
      });
      expect(ApplicantOtpModel.deleteMany).toHaveBeenCalledWith({
        emailAddress: emailId,
      });
      expect(ApplicantOtpModel.create).toHaveBeenCalledWith({
        emailAddress: emailId,
        otp: '3003',
        isUsed: false,
      });
      expect(result).toEqual({
        exists: true,
        message: `OTP is sent to ${emailId}`,
      });
    });

    it('should return exists true when applicant found in production', async () => {
      process.env.NODE_ENV = 'production';
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication,
      );

      const result = await aobService.checkApplicantExists(emailId);

      expect(mockEmailTransporter.sendMail).toHaveBeenCalled();
      expect(result).toEqual({
        exists: true,
        message: `OTP is sent to ${emailId}`,
      });
    });

    it('should return exists false when applicant not found', async () => {
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await aobService.checkApplicantExists(emailId);

      expect(result).toEqual({
        exists: false,
        message: 'Application not found',
      });
    });

    it('should continue even when email sending fails', async () => {
      process.env.NODE_ENV = 'production';
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication,
      );
      mockEmailTransporter.sendMail.mockRejectedValue(new Error('Email error'));

      const result = await aobService.checkApplicantExists(emailId);

      expect(result).toEqual({
        exists: true,
        message: `OTP is sent to ${emailId}`,
      });
    });

    it('should handle error when checking applicant fails', async () => {
      const error = new Error('Database error');
      (AobApplicationModel.findOne as jest.Mock).mockRejectedValue(error);

      await expect(aobService.checkApplicantExists(emailId)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('validateOtp', () => {
    const emailId = 'test@example.com';
    const otp = '1234';

    it('should validate OTP successfully', async () => {
      const mockOtpRecord = {
        _id: new mongoose.Types.ObjectId(),
        emailAddress: emailId,
        otp,
        isUsed: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      };

      (ApplicantOtpModel.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockOtpRecord),
      });
      (ApplicantOtpModel.updateOne as jest.Mock).mockResolvedValue({});
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue({
        ...mockApplication,
        toObject: jest.fn().mockReturnValue(mockApplication),
      });

      const result = await aobService.validateOtp(emailId, otp);

      expect(ApplicantOtpModel.updateOne).toHaveBeenCalledWith(
        { _id: mockOtpRecord._id },
        { isUsed: true },
      );
      expect(result).toEqual({
        verified: true,
        message: 'Applicant is verified',
        applicationData: mockApplication,
      });
    });

    it('should return false when no OTP found', async () => {
      (ApplicantOtpModel.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      });

      const result = await aobService.validateOtp(emailId, otp);

      expect(result).toEqual({
        verified: false,
        message: 'No valid OTP found',
      });
    });

    it('should return false when OTP is expired', async () => {
      const mockOtpRecord = {
        _id: new mongoose.Types.ObjectId(),
        emailAddress: emailId,
        otp,
        isUsed: false,
        createdAt: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
      };

      (ApplicantOtpModel.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockOtpRecord),
      });
      (ApplicantOtpModel.deleteOne as jest.Mock).mockResolvedValue({});

      const result = await aobService.validateOtp(emailId, otp);

      expect(ApplicantOtpModel.deleteOne).toHaveBeenCalledWith({
        _id: mockOtpRecord._id,
      });
      expect(result).toEqual({
        verified: false,
        message: 'OTP has expired',
      });
    });

    it('should return false when OTP is invalid', async () => {
      const mockOtpRecord = {
        _id: new mongoose.Types.ObjectId(),
        emailAddress: emailId,
        otp: '9999',
        isUsed: false,
        createdAt: new Date(),
      };

      (ApplicantOtpModel.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockOtpRecord),
      });

      const result = await aobService.validateOtp(emailId, otp);

      expect(result).toEqual({
        verified: false,
        message: 'Invalid OTP',
      });
    });

    it('should return false when application not found after OTP validation', async () => {
      const mockOtpRecord = {
        _id: new mongoose.Types.ObjectId(),
        emailAddress: emailId,
        otp,
        isUsed: false,
        createdAt: new Date(),
      };

      (ApplicantOtpModel.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockOtpRecord),
      });
      (ApplicantOtpModel.updateOne as jest.Mock).mockResolvedValue({});
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await aobService.validateOtp(emailId, otp);

      expect(result).toEqual({
        verified: false,
        message: 'Application not found',
      });
    });
  });

  describe('resendOtp', () => {
    const emailId = 'test@example.com';

    beforeEach(() => {
      (ApplicantOtpModel.deleteMany as jest.Mock).mockResolvedValue({});
      (ApplicantOtpModel.create as jest.Mock).mockResolvedValue({});
      mockEmailTransporter.sendMail.mockResolvedValue({} as any);
    });

    it('should resend OTP successfully in development', async () => {
      process.env.NODE_ENV = 'development';
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication,
      );

      const result = await aobService.resendOtp(emailId);

      expect(ApplicantOtpModel.create).toHaveBeenCalledWith({
        emailAddress: emailId,
        otp: '3003',
        isUsed: false,
      });
      expect(result).toEqual({
        success: true,
        message: `OTP is resent to ${emailId}`,
      });
    });

    it('should resend OTP successfully in production', async () => {
      process.env.NODE_ENV = 'production';
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication,
      );

      const result = await aobService.resendOtp(emailId);

      expect(mockEmailTransporter.sendMail).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: `OTP is resent to ${emailId}`,
      });
    });

    it('should return false when application not found', async () => {
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await aobService.resendOtp(emailId);

      expect(result).toEqual({
        success: false,
        message: 'Application not found',
      });
    });
  });

  describe('sendEmailVerificationOtp', () => {
    const emailId = 'test@example.com';

    beforeEach(() => {
      (ApplicantOtpModel.deleteMany as jest.Mock).mockResolvedValue({});
      (ApplicantOtpModel.create as jest.Mock).mockResolvedValue({});
      mockEmailTransporter.sendMail.mockResolvedValue({} as any);
    });

    it('should send email verification OTP successfully', async () => {
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication,
      );

      const result = await aobService.sendEmailVerificationOtp(emailId);

      expect(result).toEqual({
        success: true,
        message: `OTP sent to ${emailId}`,
      });
    });

    it('should return false for invalid email format', async () => {
      const invalidEmail = 'invalid-email';

      const result = await aobService.sendEmailVerificationOtp(invalidEmail);

      expect(result).toEqual({
        success: false,
        message: 'Invalid email format',
      });
    });

    it('should return false when email not found', async () => {
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await aobService.sendEmailVerificationOtp(emailId);

      expect(result).toEqual({
        success: false,
        message: 'Email not found in our records',
      });
    });
  });

  describe('verifyEmailOtp', () => {
    const emailId = 'test@example.com';
    const otp = '1234';

    it('should verify email OTP successfully with application status', async () => {
      const mockOtpRecord = {
        _id: new mongoose.Types.ObjectId(),
        emailAddress: emailId,
        otp,
        isUsed: false,
        createdAt: new Date(),
      };

      (ApplicantOtpModel.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockOtpRecord),
      });
      (ApplicantOtpModel.deleteOne as jest.Mock).mockResolvedValue({});
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue({
        ...mockApplication,
        applicationStatus: 'approved',
      });

      const result = await aobService.verifyEmailOtp(emailId, otp);

      expect(result).toEqual({
        success: true,
        message:
          'Your application has been approved. You can proceed with the next steps.',
        applicationStatus: 'approved',
        rejectionReason: undefined,
      });
    });

    it('should return rejection reason for rejected applications', async () => {
      const mockOtpRecord = {
        _id: new mongoose.Types.ObjectId(),
        emailAddress: emailId,
        otp,
        isUsed: false,
        createdAt: new Date(),
      };

      (ApplicantOtpModel.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockOtpRecord),
      });
      (ApplicantOtpModel.deleteOne as jest.Mock).mockResolvedValue({});
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue({
        ...mockApplication,
        applicationStatus: 'rejected',
        rejectRemark: 'Documents incomplete',
      });

      const result = await aobService.verifyEmailOtp(emailId, otp);

      expect(result).toEqual({
        success: true,
        message:
          'Your application has been rejected. Please contact support for more information.',
        applicationStatus: 'rejected',
        rejectionReason: 'Documents incomplete',
      });
    });

    it('should handle various application statuses', async () => {
      const testCases = [
        {
          status: 'returned',
          expectedMessage:
            'Your application has been returned for corrections.',
        },
        {
          status: 'underReview',
          expectedMessage: 'Your application is currently under review.',
        },
        {
          status: 'applicationSubmitted',
          expectedMessage:
            'Your application has been submitted successfully and is pending review.',
        },
        { status: undefined, expectedMessage: 'Email is verified.' },
      ];

      for (const testCase of testCases) {
        const mockOtpRecord = {
          _id: new mongoose.Types.ObjectId(),
          emailAddress: emailId,
          otp,
          isUsed: false,
          createdAt: new Date(),
        };

        (ApplicantOtpModel.findOne as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockOtpRecord),
        });
        (ApplicantOtpModel.deleteOne as jest.Mock).mockResolvedValue({});
        (AobApplicationModel.findOne as jest.Mock).mockResolvedValue({
          ...mockApplication,
          applicationStatus: testCase.status,
        });

        const result = await aobService.verifyEmailOtp(emailId, otp);

        expect(result.message).toBe(testCase.expectedMessage);
      }
    });
  });

  describe('getApplicationById', () => {
    const applicationId = new mongoose.Types.ObjectId().toString();

    it('should get application by ID successfully', async () => {
      (mongoose.Types.ObjectId as any).mockImplementation((id: string) => ({
        toString: () => id,
      }));
      (AobApplicationModel.findById as jest.Mock).mockResolvedValue({
        ...mockApplication,
        toObject: jest.fn().mockReturnValue(mockApplication),
      });

      const result = await aobService.getApplicationById(applicationId);

      expect(result).toEqual({
        success: true,
        data: mockApplication,
      });
    });

    it('should return false when application not found', async () => {
      (AobApplicationModel.findById as jest.Mock).mockResolvedValue(null);

      const result = await aobService.getApplicationById(applicationId);

      expect(result).toEqual({
        success: false,
        message: 'Application does not exist',
      });
    });
  });

  describe('getDocumentDetails', () => {
    const applicationId = 'APP123';
    const documentId = 'DOC123';

    it('should get document details successfully', async () => {
      const mockDocument = {
        documentId,
        applicationId,
        documentType: 'passport',
        documentStatus: 'approve',
      };

      const mockHistory = [
        { documentId, status: 'approve', createdAt: new Date() },
      ];

      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue({
        ...mockApplication,
        qcAndDiscrepencyList: [
          { documentType: 'passport', remarks: 'Test remark' },
        ],
      });
      (AobDocumentModel.findOne as jest.Mock).mockResolvedValue(mockDocument);
      (AobDocumentHistoryModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockHistory),
        }),
      });

      const result = await aobService.getDocumentDetails(
        applicationId,
        documentId,
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('document');
      expect(result.data).toHaveProperty('history');
      expect(result.data).toHaveProperty('discrepancy');
      expect(result.data).toHaveProperty('application');
    });

    it('should return false when application not found', async () => {
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await aobService.getDocumentDetails(
        applicationId,
        documentId,
      );

      expect(result).toEqual({
        success: false,
        message: 'Application not found',
      });
    });

    it('should return false when document not found', async () => {
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication,
      );
      (AobDocumentModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await aobService.getDocumentDetails(
        applicationId,
        documentId,
      );

      expect(result).toEqual({
        success: false,
        message: 'Document not found',
      });
    });
  });

  describe('batchUpdateDocumentStatus', () => {
    const applicationId = 'APP123';
    const documents: DocumentStatusUpdateDto[] = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        documentId: 'DOC123',
        documentStatus: 'approve',
        remarks: 'Approved',
      },
    ];

    beforeEach(() => {
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication,
      );
      (AobApplicationModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        mockApplication,
      );
      (AobDocumentModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        _id: documents[0]._id,
        documentType: 'passport',
        documentFormat: 'pdf',
        documentName: 'test.pdf',
        presignedS3Url: 'https://test.com/file.pdf',
        s3Key: 'test-key',
      });
      (AobDocumentHistoryModel.create as jest.Mock).mockResolvedValue({});
      (AobApplicationModel.updateOne as jest.Mock).mockResolvedValue({});
    });

    it('should batch update document status successfully', async () => {
      const result = await aobService.batchUpdateDocumentStatus(
        applicationId,
        documents,
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        documentId: documents[0].documentId,
        _id: documents[0]._id,
        success: true,
        status: documents[0].documentStatus,
      });
    });

    it('should handle document not found in batch update', async () => {
      (AobDocumentModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await aobService.batchUpdateDocumentStatus(
        applicationId,
        documents,
      );

      expect(result.results[0]).toEqual({
        documentId: documents[0].documentId,
        _id: documents[0]._id,
        success: false,
        message: 'Document not found',
      });
    });

    it('should handle reject status in batch update', async () => {
      const rejectDocuments: DocumentStatusUpdateDto[] = [
        {
          ...documents[0],
          documentStatus: 'reject',
        },
      ];

      await aobService.batchUpdateDocumentStatus(
        applicationId,
        rejectDocuments,
      );

      expect(AobApplicationModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockApplication._id,
        expect.objectContaining({
          $push: expect.objectContaining({
            qcAndDiscrepencyList: expect.any(Object),
          }),
        }),
        { new: true },
      );
    });

    it('should throw error when application not found', async () => {
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        aobService.batchUpdateDocumentStatus(applicationId, documents),
      ).rejects.toThrow('Application not found');
    });
  });

  describe('sendShareableLinkEmail', () => {
    const emailId = 'test@example.com';
    const link = 'https://example.com/share';

    it('should send shareable link email successfully', async () => {
      await expect(
        aobService.sendShareableLinkEmail(emailId, link),
      ).resolves.not.toThrow();
    });

    it('should handle error when sending email fails', async () => {
      // Mock AobEmailTemplates to throw error
      jest
        .spyOn(AobEmailTemplates, 'sendShareableLinkEmail')
        .mockRejectedValue(new Error('Email service error'));

      // The method doesn't throw, it just logs the error
      await expect(
        aobService.sendShareableLinkEmail(emailId, link),
      ).resolves.not.toThrow();

      jest.restoreAllMocks();
    });
  });

  describe('sendShareableLinkSms', () => {
    const smsNo = '1234567890';
    const link = 'https://example.com/share';

    it('should send shareable link SMS successfully', async () => {
      await expect(
        aobService.sendShareableLinkSms(smsNo, link),
      ).resolves.not.toThrow();
    });

    it('should handle error when sending SMS fails', async () => {
      // Mock setTimeout to throw error
      jest.spyOn(global, 'setTimeout').mockImplementation((() => {
        throw new Error('Timeout error');
      }) as never);

      await expect(
        aobService.sendShareableLinkSms(smsNo, link),
      ).rejects.toThrow('Timeout error');

      jest.restoreAllMocks();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle various error types properly', async () => {
      const customError = new Error('Custom error message');
      mockAobRepository.createDocumentMaster.mockRejectedValue(customError);

      await expect(
        aobService.createDocumentMaster(mockCreateDocumentMasterDto),
      ).rejects.toThrow('Custom error message');
    });

    it('should handle null and undefined values', async () => {
      mockAobRepository.findDocumentMasterById.mockResolvedValue(null);

      const result = await aobService.getDocumentMasterById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should handle empty arrays', async () => {
      mockAobRepository.findDocumentMastersByCategory.mockResolvedValue([]);

      const result = await aobService.getDocumentMastersByCategory(
        'non-existent-category',
      );

      expect(result).toEqual([]);
    });
  });

  describe('Additional coverage for upload document edge cases', () => {
    const documentId = 'DOC123';
    const documentType = 'passport';
    const documentFormat = 'pdf';

    beforeEach(() => {
      mockAobRepository.findDocumentMasterByType.mockResolvedValue(
        mockDocumentMaster as never,
      );
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication,
      );
      (AobApplicationModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        mockApplication,
      );
      (AobApplicationModel.updateOne as jest.Mock).mockResolvedValue({});
      (AobDocumentModel.findOneAndUpdate as jest.Mock).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        documentId,
        applicationId: mockApplication.applicationId,
        documentStatus: 'approve',
        documentType,
        documentFormat,
        documentName: mockFile.originalname,
        presignedS3Url:
          'https://test-bucket.s3.ap-southeast-1.amazonaws.com/mock-uuid-1234.pdf',
        s3Key: 'mock-uuid-1234.pdf',
        remarks: 'Test remark',
      });
      (AobDocumentHistoryModel.create as jest.Mock).mockResolvedValue({});
      mockS3Client.send.mockResolvedValue({} as never);
    });

    it('should handle reject status with existing discrepancy', async () => {
      const applicationWithDiscrepancy = {
        ...mockApplication,
        qcAndDiscrepencyList: [{ documentType, remarks: 'Existing remark' }],
      };
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        applicationWithDiscrepancy,
      );

      await aobService.uploadDocument(
        documentId,
        documentType,
        documentFormat,
        'reject',
        mockFile,
      );

      expect(AobApplicationModel.updateOne).toHaveBeenCalledWith(
        {
          _id: applicationWithDiscrepancy._id,
          'qcAndDiscrepencyList.documentType': documentType,
        },
        expect.objectContaining({
          $set: expect.objectContaining({
            'qcAndDiscrepencyList.$.documentFormat': documentFormat,
            'qcAndDiscrepencyList.$.documentName': mockFile.originalname,
            'qcAndDiscrepencyList.$.remarks': 'Test remark',
            'qcAndDiscrepencyList.$.createdAt': expect.any(Date),
          }),
        }),
      );
    });

    it('should handle invalid projectId', async () => {
      const invalidProjectId = 'invalid-id';
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      await aobService.uploadDocument(
        documentId,
        documentType,
        documentFormat,
        'approve',
        mockFile,
        invalidProjectId,
      );

      expect(AobApplicationModel.findByIdAndUpdate).not.toHaveBeenCalledWith(
        mockApplication._id,
        { projectId: expect.any(mongoose.Types.ObjectId) },
        { new: true },
      );
    });

    it('should handle documentSubmitted status', async () => {
      await aobService.uploadDocument(
        documentId,
        documentType,
        documentFormat,
        'documentSubmitted',
        mockFile,
      );

      expect(AobDocumentModel.findOneAndUpdate).toHaveBeenCalled();
      expect(AobDocumentHistoryModel.create).toHaveBeenCalled();
    });
  });

  describe('Additional coverage for batch update edge cases', () => {
    const applicationId = 'APP123';

    beforeEach(() => {
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication,
      );
      (AobApplicationModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        mockApplication,
      );
      (AobApplicationModel.updateOne as jest.Mock).mockResolvedValue({});
      (AobDocumentHistoryModel.create as jest.Mock).mockResolvedValue({});
    });

    it('should handle qcReject status in batch update', async () => {
      const documents: DocumentStatusUpdateDto[] = [
        {
          _id: new mongoose.Types.ObjectId().toString(),
          documentId: 'DOC123',
          documentStatus: 'qcReject',
          remarks: 'QC rejected',
        },
      ];

      (AobDocumentModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        _id: documents[0]._id,
        documentType: 'passport',
        documentFormat: 'pdf',
        documentName: 'test.pdf',
        presignedS3Url: 'https://test.com/file.pdf',
        s3Key: 'test-key',
      });

      await aobService.batchUpdateDocumentStatus(applicationId, documents);

      expect(AobApplicationModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockApplication._id,
        expect.objectContaining({
          applicationStatus: 'qcRejected',
          $push: expect.objectContaining({
            qcAndDiscrepencyList: expect.any(Object),
          }),
        }),
        { new: true },
      );
    });

    it('should handle existing discrepancy in batch update reject', async () => {
      const documents: DocumentStatusUpdateDto[] = [
        {
          _id: new mongoose.Types.ObjectId().toString(),
          documentId: 'DOC123',
          documentStatus: 'reject',
          remarks: 'Rejected in batch',
        },
      ];

      const applicationWithDiscrepancy = {
        ...mockApplication,
        qcAndDiscrepencyList: [
          { documentType: 'passport', remarks: 'Existing remark' },
        ],
      };
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        applicationWithDiscrepancy,
      );
      (AobDocumentModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        _id: documents[0]._id,
        documentType: 'passport',
        documentFormat: 'pdf',
        documentName: 'test.pdf',
        presignedS3Url: 'https://test.com/file.pdf',
        s3Key: 'test-key',
      });

      await aobService.batchUpdateDocumentStatus(applicationId, documents);

      expect(AobApplicationModel.updateOne).toHaveBeenCalledWith(
        {
          _id: applicationWithDiscrepancy._id,
          'qcAndDiscrepencyList.documentType': 'passport',
        },
        expect.objectContaining({
          $set: expect.objectContaining({
            'qcAndDiscrepencyList.$.remarks': 'Rejected in batch',
            'qcAndDiscrepencyList.$.createdAt': expect.any(Date),
          }),
        }),
      );
    });

    it('should handle batch update with invalid projectId', async () => {
      const documents: DocumentStatusUpdateDto[] = [
        {
          _id: new mongoose.Types.ObjectId().toString(),
          documentId: 'DOC123',
          documentStatus: 'approve',
        },
      ];
      const invalidProjectId = 'invalid-id';
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);
      (AobDocumentModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        _id: documents[0]._id,
        documentType: 'passport',
        documentFormat: 'pdf',
        documentName: 'test.pdf',
        presignedS3Url: 'https://test.com/file.pdf',
        s3Key: 'test-key',
      });

      await aobService.batchUpdateDocumentStatus(
        applicationId,
        documents,
        invalidProjectId,
      );

      expect(AobApplicationModel.findByIdAndUpdate).not.toHaveBeenCalledWith(
        mockApplication._id,
        { projectId: expect.any(mongoose.Types.ObjectId) },
        { new: true },
      );
    });

    it('should handle individual document errors in batch update', async () => {
      const documents: DocumentStatusUpdateDto[] = [
        {
          _id: new mongoose.Types.ObjectId().toString(),
          documentId: 'DOC123',
          documentStatus: 'approve',
        },
      ];

      (AobDocumentModel.findByIdAndUpdate as jest.Mock).mockRejectedValue(
        new Error('Document update failed'),
      );

      const result = await aobService.batchUpdateDocumentStatus(
        applicationId,
        documents,
      );

      expect(result.results[0]).toEqual({
        documentId: documents[0].documentId,
        _id: documents[0]._id,
        success: false,
        message: 'Document update failed',
      });
    });
  });

  describe('Additional OTP and email verification coverage', () => {
    const emailId = 'test@example.com';

    it('should handle OTP validation when application exists but verification successful', async () => {
      const mockOtpRecord = {
        _id: new mongoose.Types.ObjectId(),
        emailAddress: emailId,
        otp: '1234',
        isUsed: false,
        createdAt: new Date(),
      };

      (ApplicantOtpModel.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockOtpRecord),
      });
      (ApplicantOtpModel.deleteOne as jest.Mock).mockResolvedValue({});
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await aobService.verifyEmailOtp(emailId, '1234');

      expect(result).toEqual({
        success: true,
        message: 'Email is verified',
      });
    });

    it('should handle resend OTP email failure gracefully', async () => {
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication,
      );
      (ApplicantOtpModel.deleteMany as jest.Mock).mockResolvedValue({});
      (ApplicantOtpModel.create as jest.Mock).mockResolvedValue({});
      mockEmailTransporter.sendMail.mockRejectedValue(
        new Error('Email service down'),
      );

      process.env.NODE_ENV = 'production';

      const result = await aobService.resendOtp(emailId);

      expect(result).toEqual({
        success: true,
        message: `OTP is resent to ${emailId}`,
      });
    });

    it('should handle email verification OTP email failure gracefully', async () => {
      (AobApplicationModel.findOne as jest.Mock).mockResolvedValue(
        mockApplication,
      );
      (ApplicantOtpModel.deleteMany as jest.Mock).mockResolvedValue({});
      (ApplicantOtpModel.create as jest.Mock).mockResolvedValue({});
      mockEmailTransporter.sendMail.mockRejectedValue(
        new Error('Email service error'),
      );

      const result = await aobService.sendEmailVerificationOtp(emailId);

      expect(result).toEqual({
        success: true,
        message: `OTP sent to ${emailId}`,
      });
    });
  });

  describe('Private method coverage', () => {
    it('should test mapToResponseDto with undefined category', async () => {
      const documentMasterWithoutCategory = {
        ...mockDocumentMaster,
        category: undefined,
      };
      mockAobRepository.createDocumentMaster.mockResolvedValue(
        documentMasterWithoutCategory as never,
      );

      const result = await aobService.createDocumentMaster(
        mockCreateDocumentMasterDto,
      );

      expect(result.category).toBe('');
    });
  });
});
