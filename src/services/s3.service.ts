import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { awsConfig } from '@/config/aws.config';
import logger from '@/common/utils/logger';

export interface S3UploadResult {
  fileKey: string;
  fileUrl: string;
}

export class S3Service {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: awsConfig.region,
      credentials: awsConfig.credentials,
    });
  }

  public async uploadFile(
    key: string,
    file: Buffer,
    contentType?: string,
  ): Promise<S3UploadResult> {
    try {
      const command = new PutObjectCommand({
        Bucket: awsConfig.s3.bucket,
        Key: `Salesverse/${key}`,
        Body: file,
        ContentType: contentType ?? this.getDefaultContentType(key),
        CacheControl: 'public, max-age=31536000', // Cache for 1 year
      });

      await this.s3Client.send(command);

      return {
        fileKey: `Salesverse/${key}`,
        fileUrl: `${awsConfig.s3.baseUrl}${key}`,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to upload file:', {
        error: err.message,
        stack: err.stack,
        key,
        contentType,
      });
      throw err;
    }
  }

  public async uploadMultipleFiles(
    files: Array<{ key: string; file: Buffer; contentType?: string }>,
  ): Promise<S3UploadResult[]> {
    try {
      const promises = files.map(({ key, file, contentType }) =>
        this.uploadFile(key, file, contentType),
      );

      return await Promise.all(promises);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to upload multiple files:', {
        error: err.message,
        stack: err.stack,
      });
      throw err;
    }
  }

  private getDefaultContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      // Images
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'svg':
        return 'image/svg+xml';
      case 'tiff':
      case 'tif':
        return 'image/tiff';
      case 'bmp':
        return 'image/bmp';

      // Videos
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      case 'avi':
        return 'video/x-msvideo';
      case 'mov':
        return 'video/quicktime';
      case 'wmv':
        return 'video/x-ms-wmv';
      case 'flv':
        return 'video/x-flv';
      case '3gp':
        return 'video/3gpp';

      // Documents
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'ppt':
        return 'application/vnd.ms-powerpoint';
      case 'pptx':
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      case 'txt':
        return 'text/plain';
      case 'csv':
        return 'text/csv';
      case 'rtf':
        return 'application/rtf';

      default:
        return 'application/octet-stream';
    }
  }

  public getFileExtension(fileType: string, contentType?: string): string {
    if (contentType) {
      const extension = contentType.split('/').pop();
      if (extension) {
        switch (extension) {
          case 'jpeg':
            return '.jpg';
          case 'quicktime':
            return '.mov';
          case 'x-msvideo':
            return '.avi';
          case 'x-ms-wmv':
            return '.wmv';
          case 'x-flv':
            return '.flv';
          case '3gpp':
            return '.3gp';
          case 'vnd.openxmlformats-officedocument.wordprocessingml.document':
            return '.docx';
          case 'vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            return '.xlsx';
          case 'vnd.openxmlformats-officedocument.presentationml.presentation':
            return '.pptx';
          default:
            return `.${extension}`;
        }
      }
    }

    switch (fileType.toLowerCase()) {
      case 'video':
        return '.mp4';
      case 'image':
        return '.jpg';
      case 'document':
        return '.pdf';
      default:
        return '';
    }
  }
}
