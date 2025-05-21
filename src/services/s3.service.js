import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand,
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

class S3Service {
  constructor() {
    this.client = new S3Client({
      region: config.aws.region,
      credentials: config.aws.credentials,
    });
    this.bucket = config.aws.s3.bucket;
  }

  async uploadFile(file, folder = 'general') {
    try {
      const extension = mime.extension(file.mimetype);
      const key = `${folder}/${uuidv4()}.${extension}`;

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'private',
        Metadata: {
          originalname: file.originalname,
        },
      });

      await this.client.send(command);

      logger.info({
        key,
        size: file.size,
        mimetype: file.mimetype,
      }, 'File uploaded successfully to S3');

      return {
        key,
        url: `${config.aws.s3.url}/${key}`,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to upload file to S3');
      throw error;
    }
  }

  async getSignedUrl(key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });

      logger.info({ key }, 'Generated signed URL for S3 object');
      return url;
    } catch (error) {
      logger.error({ error }, 'Failed to generate signed URL');
      throw error;
    }
  }

  async deleteFile(key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      logger.info({ key }, 'File deleted from S3');
    } catch (error) {
      logger.error({ error }, 'Failed to delete file from S3');
      throw error;
    }
  }

  async uploadMultipleFiles(files, folder = 'general') {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, folder));
      const results = await Promise.all(uploadPromises);

      logger.info({
        count: files.length,
        folder,
      }, 'Multiple files uploaded successfully to S3');

      return results;
    } catch (error) {
      logger.error({ error }, 'Failed to upload multiple files to S3');
      throw error;
    }
  }

  async deleteMultipleFiles(keys) {
    try {
      const deletePromises = keys.map(key => this.deleteFile(key));
      await Promise.all(deletePromises);

      logger.info({
        count: keys.length,
      }, 'Multiple files deleted from S3');
    } catch (error) {
      logger.error({ error }, 'Failed to delete multiple files from S3');
      throw error;
    }
  }
}

export const s3Service = new S3Service();