import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  DocumentStatusUpdateDto,
  BatchUpdateDocumentStatusDto,
} from '../batch-update-document-status.dto';

describe('DocumentStatusUpdateDto', () => {
  describe('constructor and property assignment', () => {
    it('should create instance with all properties', () => {
      const dto = new DocumentStatusUpdateDto();
      dto._id = '507f1f77bcf86cd799439011';
      dto.documentId = 'DOC123456';
      dto.documentStatus = 'approve';
      dto.remarks = 'Test remarks';
      dto.type = 'main';
      dto.infoName = 'Main Document';

      expect(dto._id).toBe('507f1f77bcf86cd799439011');
      expect(dto.documentId).toBe('DOC123456');
      expect(dto.documentStatus).toBe('approve');
      expect(dto.remarks).toBe('Test remarks');
      expect(dto.type).toBe('main');
      expect(dto.infoName).toBe('Main Document');
    });

    it('should create instance with minimal required properties', () => {
      const dto = new DocumentStatusUpdateDto();
      dto._id = '507f1f77bcf86cd799439011';
      dto.documentId = 'DOC123456';
      dto.documentStatus = 'reject';

      expect(dto._id).toBe('507f1f77bcf86cd799439011');
      expect(dto.documentId).toBe('DOC123456');
      expect(dto.documentStatus).toBe('reject');
      expect(dto.remarks).toBeUndefined();
      expect(dto.type).toBeUndefined();
      expect(dto.infoName).toBeUndefined();
    });

    it('should handle all valid document statuses', () => {
      const statuses: Array<
        'approve' | 'reject' | 'qcReject' | 'documentSubmitted'
      > = ['approve', 'reject', 'qcReject', 'documentSubmitted'];

      statuses.forEach(status => {
        const dto = new DocumentStatusUpdateDto();
        dto._id = '507f1f77bcf86cd799439011';
        dto.documentId = 'DOC123456';
        dto.documentStatus = status;

        expect(dto.documentStatus).toBe(status);
      });
    });
  });

  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToClass(DocumentStatusUpdateDto, {
        _id: '507f1f77bcf86cd799439011',
        documentId: 'DOC123456',
        documentStatus: 'approve',
        remarks: 'Approved successfully',
        type: 'main',
        infoName: 'Main Document',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with minimal required data', async () => {
      const dto = plainToClass(DocumentStatusUpdateDto, {
        _id: '507f1f77bcf86cd799439011',
        documentId: 'DOC123456',
        documentStatus: 'approve',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when _id is missing', async () => {
      const dto = plainToClass(DocumentStatusUpdateDto, {
        documentId: 'DOC123456',
        documentStatus: 'approve',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('_id');
    });

    it('should fail validation when _id is not a valid MongoDB ObjectId', async () => {
      const dto = plainToClass(DocumentStatusUpdateDto, {
        _id: 'invalid-id',
        documentId: 'DOC123456',
        documentStatus: 'approve',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('_id');
    });

    it('should fail validation when documentId is missing', async () => {
      const dto = plainToClass(DocumentStatusUpdateDto, {
        _id: '507f1f77bcf86cd799439011',
        documentStatus: 'approve',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('documentId');
    });

    it('should fail validation when documentId is empty', async () => {
      const dto = plainToClass(DocumentStatusUpdateDto, {
        _id: '507f1f77bcf86cd799439011',
        documentId: '',
        documentStatus: 'approve',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('documentId');
    });

    it('should fail validation when documentStatus is missing', async () => {
      const dto = plainToClass(DocumentStatusUpdateDto, {
        _id: '507f1f77bcf86cd799439011',
        documentId: 'DOC123456',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('documentStatus');
    });

    it('should fail validation when documentStatus is invalid', async () => {
      const dto = plainToClass(DocumentStatusUpdateDto, {
        _id: '507f1f77bcf86cd799439011',
        documentId: 'DOC123456',
        documentStatus: 'invalid-status',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('documentStatus');
    });

    it('should pass validation when optional fields are provided', async () => {
      const dto = plainToClass(DocumentStatusUpdateDto, {
        _id: '507f1f77bcf86cd799439011',
        documentId: 'DOC123456',
        documentStatus: 'reject',
        remarks: 'Document needs revision',
        type: 'supporting',
        infoName: 'Supporting Document',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation when optional fields are undefined', async () => {
      const dto = plainToClass(DocumentStatusUpdateDto, {
        _id: '507f1f77bcf86cd799439011',
        documentId: 'DOC123456',
        documentStatus: 'approve',
        remarks: undefined,
        type: undefined,
        infoName: undefined,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle very long strings in optional fields', async () => {
      const longString = 'a'.repeat(1000);
      const dto = plainToClass(DocumentStatusUpdateDto, {
        _id: '507f1f77bcf86cd799439011',
        documentId: 'DOC123456',
        documentStatus: 'approve',
        remarks: longString,
        type: longString,
        infoName: longString,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle special characters in string fields', async () => {
      const dto = plainToClass(DocumentStatusUpdateDto, {
        _id: '507f1f77bcf86cd799439011',
        documentId: 'DOC-123_456.test',
        documentStatus: 'approve',
        remarks: 'Special chars: !@#$%^&*()',
        type: 'type-with-dashes_and_underscores',
        infoName: 'Info with spaces and symbols: []{}',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});

describe('BatchUpdateDocumentStatusDto', () => {
  describe('constructor and property assignment', () => {
    it('should create instance with all properties', () => {
      const dto = new BatchUpdateDocumentStatusDto();
      dto.applicationId = 'APP123456789';
      dto.projectId = '507f1f77bcf86cd799439011';
      dto.documents = [
        {
          _id: '507f1f77bcf86cd799439012',
          documentId: 'DOC123',
          documentStatus: 'approve',
          remarks: 'Approved',
          type: 'main',
          infoName: 'Main Document',
        } as DocumentStatusUpdateDto,
      ];

      expect(dto.applicationId).toBe('APP123456789');
      expect(dto.projectId).toBe('507f1f77bcf86cd799439011');
      expect(dto.documents).toHaveLength(1);
      expect(dto.documents[0]._id).toBe('507f1f77bcf86cd799439012');
    });

    it('should create instance with minimal required properties', () => {
      const dto = new BatchUpdateDocumentStatusDto();
      dto.applicationId = 'APP123456789';
      dto.documents = [
        {
          _id: '507f1f77bcf86cd799439012',
          documentId: 'DOC123',
          documentStatus: 'approve',
        } as DocumentStatusUpdateDto,
      ];

      expect(dto.applicationId).toBe('APP123456789');
      expect(dto.projectId).toBeUndefined();
      expect(dto.documents).toHaveLength(1);
    });

    it('should handle multiple documents', () => {
      const dto = new BatchUpdateDocumentStatusDto();
      dto.applicationId = 'APP123456789';
      dto.documents = [
        {
          _id: '507f1f77bcf86cd799439012',
          documentId: 'DOC123',
          documentStatus: 'approve',
        } as DocumentStatusUpdateDto,
        {
          _id: '507f1f77bcf86cd799439013',
          documentId: 'DOC456',
          documentStatus: 'reject',
          remarks: 'Needs revision',
        } as DocumentStatusUpdateDto,
      ];

      expect(dto.documents).toHaveLength(2);
      expect(dto.documents[0].documentStatus).toBe('approve');
      expect(dto.documents[1].documentStatus).toBe('reject');
    });
  });

  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToClass(BatchUpdateDocumentStatusDto, {
        applicationId: 'APP123456789',
        projectId: '507f1f77bcf86cd799439011',
        documents: [
          {
            _id: '507f1f77bcf86cd799439012',
            documentId: 'DOC123',
            documentStatus: 'approve',
            remarks: 'Approved',
            type: 'main',
            infoName: 'Main Document',
          },
        ],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation without optional projectId', async () => {
      const dto = plainToClass(BatchUpdateDocumentStatusDto, {
        applicationId: 'APP123456789',
        documents: [
          {
            _id: '507f1f77bcf86cd799439012',
            documentId: 'DOC123',
            documentStatus: 'approve',
          },
        ],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when applicationId is missing', async () => {
      const dto = plainToClass(BatchUpdateDocumentStatusDto, {
        documents: [
          {
            _id: '507f1f77bcf86cd799439012',
            documentId: 'DOC123',
            documentStatus: 'approve',
          },
        ],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('applicationId');
    });

    it('should fail validation when applicationId is empty', async () => {
      const dto = plainToClass(BatchUpdateDocumentStatusDto, {
        applicationId: '',
        documents: [
          {
            _id: '507f1f77bcf86cd799439012',
            documentId: 'DOC123',
            documentStatus: 'approve',
          },
        ],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('applicationId');
    });

    it('should fail validation when projectId is not a valid MongoDB ObjectId', async () => {
      const dto = plainToClass(BatchUpdateDocumentStatusDto, {
        applicationId: 'APP123456789',
        projectId: 'invalid-id',
        documents: [
          {
            _id: '507f1f77bcf86cd799439012',
            documentId: 'DOC123',
            documentStatus: 'approve',
          },
        ],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('projectId');
    });

    it('should fail validation when documents array is missing', async () => {
      const dto = plainToClass(BatchUpdateDocumentStatusDto, {
        applicationId: 'APP123456789',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('documents');
    });

    it('should fail validation when documents array is empty', async () => {
      const dto = plainToClass(BatchUpdateDocumentStatusDto, {
        applicationId: 'APP123456789',
        documents: [],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('documents');
    });

    it('should fail validation when documents contain invalid data', async () => {
      const dto = plainToClass(BatchUpdateDocumentStatusDto, {
        applicationId: 'APP123456789',
        documents: [
          {
            _id: 'invalid-id',
            documentId: '',
            documentStatus: 'invalid-status',
          },
        ],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate nested documents correctly', async () => {
      const dto = plainToClass(BatchUpdateDocumentStatusDto, {
        applicationId: 'APP123456789',
        documents: [
          {
            _id: '507f1f77bcf86cd799439012',
            documentId: 'DOC123',
            documentStatus: 'approve',
          },
          {
            _id: '507f1f77bcf86cd799439013',
            documentId: 'DOC456',
            documentStatus: 'reject',
            remarks: 'Needs revision',
          },
        ],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle large number of documents', async () => {
      const documents = Array.from({ length: 100 }, (_, index) => ({
        _id: `507f1f77bcf86cd79943${index.toString().padStart(4, '0')}`,
        documentId: `DOC${index}`,
        documentStatus: 'approve' as const,
      }));

      const dto = plainToClass(BatchUpdateDocumentStatusDto, {
        applicationId: 'APP123456789',
        documents,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.documents).toHaveLength(100);
    });

    it('should handle mixed document statuses', async () => {
      const dto = plainToClass(BatchUpdateDocumentStatusDto, {
        applicationId: 'APP123456789',
        documents: [
          {
            _id: '507f1f77bcf86cd799439012',
            documentId: 'DOC123',
            documentStatus: 'approve',
          },
          {
            _id: '507f1f77bcf86cd799439013',
            documentId: 'DOC456',
            documentStatus: 'reject',
            remarks: 'Needs revision',
          },
          {
            _id: '507f1f77bcf86cd799439014',
            documentId: 'DOC789',
            documentStatus: 'qcReject',
            remarks: 'Quality check failed',
          },
          {
            _id: '507f1f77bcf86cd799439015',
            documentId: 'DOC101',
            documentStatus: 'documentSubmitted',
          },
        ],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle very long applicationId', async () => {
      const longApplicationId = `APP${'A'.repeat(100)}`;
      const dto = plainToClass(BatchUpdateDocumentStatusDto, {
        applicationId: longApplicationId,
        documents: [
          {
            _id: '507f1f77bcf86cd799439012',
            documentId: 'DOC123',
            documentStatus: 'approve',
          },
        ],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.applicationId).toBe(longApplicationId);
    });
  });

  describe('type safety', () => {
    it('should enforce correct types for documentStatus', () => {
      const dto = new BatchUpdateDocumentStatusDto();
      dto.applicationId = 'APP123456789';

      // This should compile without errors
      const document: DocumentStatusUpdateDto = {
        _id: '507f1f77bcf86cd799439012',
        documentId: 'DOC123',
        documentStatus: 'approve', // Type-safe value
      } as DocumentStatusUpdateDto;

      dto.documents = [document];
      expect(dto.documents[0].documentStatus).toBe('approve');
    });

    it('should handle all valid document status enum values', () => {
      const validStatuses: Array<
        'approve' | 'reject' | 'qcReject' | 'documentSubmitted'
      > = ['approve', 'reject', 'qcReject', 'documentSubmitted'];

      validStatuses.forEach(status => {
        const document: DocumentStatusUpdateDto = {
          _id: '507f1f77bcf86cd799439012',
          documentId: 'DOC123',
          documentStatus: status,
        } as DocumentStatusUpdateDto;

        expect(document.documentStatus).toBe(status);
      });
    });
  });
});
