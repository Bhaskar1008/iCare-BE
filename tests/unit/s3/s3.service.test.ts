import { S3Service } from '@/services/s3.service';
import { PutObjectCommand } from '@aws-sdk/client-s3';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => {
  const mockSend = jest.fn().mockResolvedValue({});
  const MockS3Client = jest.fn().mockImplementation(() => ({
    send: mockSend,
  }));

  return {
    S3Client: MockS3Client,
    PutObjectCommand: jest.fn().mockImplementation(params => params),
  };
});

describe('S3Service', () => {
  let s3Service: S3Service;

  beforeEach(() => {
    jest.clearAllMocks();
    s3Service = new S3Service();
  });

  describe('uploadFile', () => {
    it('should upload a file to S3 successfully', async () => {
      const key = 'test-file.jpg';
      const file = Buffer.from('test file content');
      const contentType = 'image/jpeg';

      const result = await s3Service.uploadFile(key, file, contentType);

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: `Salesverse/${key}`,
          Body: file,
          ContentType: contentType,
        }),
      );

      expect(result).toEqual({
        fileKey: `Salesverse/${key}`,
        fileUrl: expect.stringContaining(key),
      });
    });

    it('should use default content type if not provided', async () => {
      const key = 'test-file.jpg';
      const file = Buffer.from('test file content');

      await s3Service.uploadFile(key, file);

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: `Salesverse/${key}`,
          Body: file,
          ContentType: 'image/jpeg', // Default for .jpg
        }),
      );
    });
  });

  describe('uploadMultipleFiles', () => {
    it('should upload multiple files to S3', async () => {
      const files = [
        {
          key: 'file1.jpg',
          file: Buffer.from('file 1 content'),
          contentType: 'image/jpeg',
        },
        {
          key: 'file2.pdf',
          file: Buffer.from('file 2 content'),
          contentType: 'application/pdf',
        },
      ];

      const results = await s3Service.uploadMultipleFiles(files);

      expect(results.length).toBe(2);
      expect(results[0].fileKey).toBe(`Salesverse/${files[0].key}`);
      expect(results[1].fileKey).toBe(`Salesverse/${files[1].key}`);

      expect(PutObjectCommand).toHaveBeenCalledTimes(2);
    });
  });

  describe('getFileExtension', () => {
    it('should return correct extension for image file type', () => {
      const extension = s3Service.getFileExtension('image');
      expect(extension).toBe('.jpg');
    });

    it('should return correct extension for video file type', () => {
      const extension = s3Service.getFileExtension('video');
      expect(extension).toBe('.mp4');
    });

    it('should return correct extension for document file type', () => {
      const extension = s3Service.getFileExtension('document');
      expect(extension).toBe('.pdf');
    });

    it('should return correct extension based on content type', () => {
      const extension = s3Service.getFileExtension('image', 'image/png');
      expect(extension).toBe('.png');
    });
  });
});
